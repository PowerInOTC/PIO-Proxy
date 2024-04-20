import { Request, Response } from 'express';
import { handleRouteError, handleFunctionError } from '../utils/sharedUtils';
import WorkerController from '../utils/worker';
import { config } from '../config';
import { getPairPriceQuerySchema } from '../zod';

export const priceController = {
  getPairPrice: async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = await getPairPriceQuerySchema.safeParseAsync(
      req.query,
    );
    if (!validatedQuery.success) {
      handleRouteError(
        res,
        400,
        'access',
        'getPairPrice',
        JSON.stringify(validatedQuery.error.issues),
      );
      return;
    }

    const a = validatedQuery.data.a;
    const b = validatedQuery.data.b;
    const abPrecisionNum =
      validatedQuery.data.abPrecision == undefined
        ? config.defaultAbPrecision
        : validatedQuery.data.abPrecision;
    const confPrecisionNum =
      validatedQuery.data.confPrecision == undefined
        ? config.defaultConfPrecision
        : validatedQuery.data.confPrecision;
    const maxTimestampDiffNum =
      validatedQuery.data.maxTimestampDiff == undefined
        ? config.defaultMaxTimestampDiff
        : validatedQuery.data.maxTimestampDiff;

    try {
      const workerController = WorkerController.getInstance(
        'priceWorker',
        './dist/workers/assetPricesUpdater.js',
      );
      const data = await workerController.sendMessageToWorker({
        type: 'getpairprice',
        payload: {
          assetA: a,
          assetB: b,
          abPrecision: abPrecisionNum,
          confPrecision: confPrecisionNum,
          maxTimestampDiff: maxTimestampDiffNum,
        },
      });

      if (data && data.type != 'resultError' && data.payload) {
        res.json(data.payload);
        return;
      } else {
        handleRouteError(res, 404, 'access', 'getPairPrice', data.payload);
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        handleFunctionError(
          'app',
          'getPairPrice',
          `Caught an error: ${error.message}`,
        );
      }

      handleRouteError(
        res,
        500,
        'access',
        'getPairPrice',
        'Internal Server Error',
      );
      return;
    }
  },
};
