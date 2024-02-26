import Fmp from '../utils/fmpUtils';
import Alpaca from '../utils/alpacaUtils';
import { parentPort } from 'worker_threads';
import { WorkerMessage } from '../types/worker';
import { Prices, RetrievedPrices } from '../types/price';
import { getPairPrice, updateAssetPrices } from '../utils/priceUtils';
import { Assets } from '../types/assets';
import { checkAsset, updateAssets } from '../services/assetsService';

let symbols: { [key: string]: string[] } = {};
let timeouts: NodeJS.Timeout[] = [];

parentPort?.on('message', async (message: WorkerMessage) => {
    if (message.type === 'setassets') {
        let stockSymbols: Assets | null = null;
        let forexSymbols: Assets | null = null;
        let retryCount = 0;

        while ((!stockSymbols || !forexSymbols) && retryCount < 3) {
            [stockSymbols, forexSymbols] = await Promise.all([
                Fmp.getStockSymbols(),
                Fmp.getForexSymbols()
            ]);
            retryCount++;
        }

        if (stockSymbols && forexSymbols) {
            const mergedSymbols: Assets = { ...stockSymbols, ...forexSymbols };
            updateAssets(mergedSymbols);

            parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: true });
        }
        else {
            parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: false });
        }
    }
    else if (message.type === 'getpairprice') {
        if (message.payload.a && message.payload.b) {
            [message.payload.a, message.payload.b].forEach(item => {
                const parts = item.split('.');
                const assetName = parts.pop();
                const assetType = parts.join('.');
                if (assetName && assetType) {
                    if (!checkAsset(assetType, assetName)) {
                        parentPort?.postMessage({ uuid: message.uuid, type: "resultError", payload: `${item} doesn't exists` });
                        return;
                    }
                }
            });

            let assetPrices: Prices = {};

            let fmpRes: RetrievedPrices | null = null;
            let alpacaRes: RetrievedPrices | null = null;
            let retryCount = 0;

            while ((!fmpRes || !alpacaRes) && retryCount < 3) {
                [fmpRes, alpacaRes] = await Promise.all([
                    Fmp.getLatestPrices([message.payload.a, message.payload.b]),
                    Alpaca.getLatestPrices([message.payload.a, message.payload.b])
                ]);
                retryCount++;
            }

            if (!fmpRes || !alpacaRes) {
                parentPort?.postMessage({ uuid: message.uuid, type: "resultError", payload: "Unable to fetch prices" });
                return;
            }

            assetPrices = updateAssetPrices(assetPrices, fmpRes);
            assetPrices = updateAssetPrices(assetPrices, alpacaRes);

            const a = assetPrices[message.payload.a];
            const b = assetPrices[message.payload.b];

            const pairPrice = getPairPrice(a, b, message.payload.abPrecision, message.payload.confPrecision, message.payload.maxTimestampDiff);
            if (!pairPrice) {
                parentPort?.postMessage({ uuid: message.uuid, type: "resultError", payload: "Unable to get pair price" });
                return;
            }

            parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: pairPrice });
        }
    }
});
