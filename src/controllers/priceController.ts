import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { handleRouteError, handleFunctionError } from '../utils/sharedUtils';
import { getAssetPrices } from '../services/assetPriceService';
import Fmp from '../utils/fmpUtils';
import WorkerController from '../utils/worker';

export const priceController = {
    getPrices: async (req: Request, res: Response): Promise<void> => {
        const { ids } = req.query as { ids?: string[] };

        if (ids !== undefined) {
            if (ids.length > 100) {
                handleRouteError(res, 400, 'access', 'get_prices', 'The ids[] parameter is too large');
                return;
            }

            // Regular expression to match hex characters + 'x'
            const hexRegex = /^[0-9a-zA-Zx.]+$/;

            for (const id of ids) {
                if (id.length > 20 || !hexRegex.test(id)) {
                    handleRouteError(res, 400, 'access', 'get_prices', 'Some elements of the ids parameter are incorrect');
                    return;
                }
            }
        }

        try {
            const workerController = WorkerController.getInstance('./dist/workers/assetPricesUpdater.js');
            const data = await workerController.sendMessageToWorker({ type: 'getprices', payload: { ids: ids } });

            if (data) {
                res.json(data.payload);
                return;
            }
            else {
                handleRouteError(res, 404, 'access', 'get_prices', `Data not found for the given price feed ID: ${ids}`);
                return;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                handleFunctionError('app', 'get_prices', `Caught an error: ${error.message}`);
            }

            handleRouteError(res, 500, 'access', 'get_prices', 'Internal Server Error');
            return;
        }
    }
}
