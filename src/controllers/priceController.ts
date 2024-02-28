import { Request, Response } from 'express';
import { handleRouteError, handleFunctionError } from '../utils/sharedUtils';
import WorkerController from '../utils/worker';
import { formatAsset } from '../utils/priceUtils';
import { config } from '../config';
import { AssetVariable } from '../types/assets';

export const priceController = {
    getPairPrice: async (req: Request, res: Response): Promise<void> => {
        const a = req.query.a;
        const b = req.query.b;
        const abPrecision = req.query.abprecision;
        const confPrecision = req.query.confprecision;
        const maxTimestampDiff = req.query.maxtimestampdiff

        if (!a || !b) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'You need to provide a & b parameters');
            return;
        }

        if (typeof a !== 'string' || typeof b !== 'string') {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'a & b parameters need to be strings');
            return;
        }

        if (a.length > 100 || b.length > 100) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'a & b parameters need to be < 100 characters');
            return;
        }

        if (!/^[a-zA-Z0-9\.\-]+$/.test(a) || !/^[a-zA-Z0-9\.\-]+$/.test(b)) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'a & b parameters should only contain letters & numbers + dot and hyphen symbols');
            return;
        }

        let abPrecisionNum: number | null = null;
        let confPrecisionNum: number | null = null;
        let maxTimestampDiffNum: number | null = null;

        if (abPrecision) {
            if (typeof abPrecision !== 'string') {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'abPrecision parameter needs to be a string');
                return;
            }

            if (!/^[\d]+$/.test(abPrecision)) {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'abPrecision parameter should only contain numbers');
                return;
            }

            abPrecisionNum = parseInt(abPrecision);
        }

        if (confPrecision) {
            if (typeof confPrecision !== 'string') {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'confPrecision parameter needs to be a string');
                return;
            }

            if (!/^[\d]+$/.test(confPrecision)) {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'confPrecision parameter should only contain numbers');
                return;
            }

            confPrecisionNum = parseInt(confPrecision);
        }

        if (maxTimestampDiff) {
            if (typeof maxTimestampDiff !== 'string') {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'maxTimestampDiff parameter needs to be a string');
                return;
            }

            if (!/^[\d]+$/.test(maxTimestampDiff)) {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'maxTimestampDiff parameter should only contain numbers');
                return;
            }

            maxTimestampDiffNum = parseInt(maxTimestampDiff);
        }

        abPrecisionNum = abPrecisionNum == null ? config.defaultAbPrecision : abPrecisionNum
        confPrecisionNum = confPrecisionNum == null ? config.defaultConfPrecision : confPrecisionNum
        maxTimestampDiffNum = maxTimestampDiffNum == null ? config.defaultMaxTimestampDiff : maxTimestampDiffNum

        if (abPrecisionNum < 0 || abPrecisionNum > config.maxAbPrecision) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'abPrecision parameter should be between 0 and ' + config.maxAbPrecision);
            return;
        }

        if (confPrecisionNum < 0 || confPrecisionNum > config.maxConfPrecision) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'confPrecision parameter should be between 0 and ' + config.maxConfPrecision);
            return;
        }

        if (maxTimestampDiffNum < 0 || maxTimestampDiffNum > config.maxMaxTimestampDiff) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'maxTimestampDiff parameter should be between 0 and ' + config.maxMaxTimestampDiff);
            return;
        }

        try {
            const workerController = WorkerController.getInstance('./dist/workers/assetPricesUpdater.js');
            const data = await workerController.sendMessageToWorker({ type: 'getpairprice', payload: { assetA: a, assetB: b, abPrecision: abPrecisionNum, confPrecision: confPrecisionNum, maxTimestampDiff: maxTimestampDiffNum } });

            if (data && data.type != "resultError" && data.payload) {
                res.json(data.payload);
                return;
            }
            else {
                handleRouteError(res, 404, 'access', 'getPairPrice', data.payload);
                return;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                handleFunctionError('app', 'getPairPrice', `Caught an error: ${error.message}`);
            }

            handleRouteError(res, 500, 'access', 'getPairPrice', 'Internal Server Error');
            return;
        }
    }
}
