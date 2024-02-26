import { Request, Response } from 'express';
import { handleRouteError, handleFunctionError } from '../utils/sharedUtils';
import WorkerController from '../utils/worker';
import { formatTicker } from '../utils/priceUtils';

export const priceController = {
    getPairPrice: async (req: Request, res: Response): Promise<void> => {
        let a = req.query.a;
        let b = req.query.b;
        let abPrecision = req.query.abprecision;
        let confPrecision = req.query.confprecision;

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

        if (!/^[a-zA-Z0-9\.]+$/.test(a) || !/^[a-zA-Z0-9\.]+$/.test(b)) {
            handleRouteError(res, 400, 'access', 'getPairPrice', 'a & b parameters should only contain letters & numbers + dot symbol');
            return;
        }

        let abPrecisionNum: number | null = null;
        let confPrecisionNum: number | null = null;

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

            if (abPrecisionNum < 0 || abPrecisionNum > 20) {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'abPrecision parameter should be between 0 and 20');
                return;
            }
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

            if (confPrecisionNum < 0 || confPrecisionNum > 20) {
                handleRouteError(res, 400, 'access', 'getPairPrice', 'confPrecision parameter should be between 0 and 20');
                return;
            }
        }

        try {
            a = formatTicker(a);
            b = formatTicker(b);

            const workerController = WorkerController.getInstance('./dist/workers/assetPricesUpdater.js');
            const data = await workerController.sendMessageToWorker({ type: 'getpairprice', payload: { a: a, b: b, abPrecision: abPrecisionNum, confPrecision: confPrecisionNum } });

            if (data && data.payload) {
                res.json(data.payload);
                return;
            }
            else {
                handleRouteError(res, 404, 'access', 'getPairPrice', 'Data not found for the given tickers');
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
