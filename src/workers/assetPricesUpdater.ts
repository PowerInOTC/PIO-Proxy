import Fmp from '../utils/fmpUtils';
import Alpaca from '../utils/alpacaUtils';
import { parentPort } from 'worker_threads';
import { WorkerMessage } from '../types/worker';
import { updateAssetPrices, getAssetPrice } from '../services/assetPriceService';
import { getPairPrice } from '../utils/priceUtils';
import { getSymbols, updateAssets } from '../services/assetsService';
import { Assets } from '../types/assets';

let symbols: { [key: string]: string[] } = {};
let timeouts: NodeJS.Timeout[] = [];

async function fetchData(provider: string, type: string) {
    try {
        let data = null;
        if (provider == "fmp" && (type == "stock.nasdaq" || type == "forex")) {
            data = await Fmp.getLatestPrices(type, symbols[type]);
        }
        else if (provider == "alpaca" && type == "stock.nasdaq") {
            data = await Alpaca.getLatestPrices(type, symbols[type]);
        }
        if (data) {
            updateAssetPrices(data);
        }
    } catch (error) {
        parentPort?.postMessage({ type: 'error', payload: error });
    }
}

parentPort?.on('message', async (message: WorkerMessage) => {
    if (message.type === 'start') {
        fetchData("fmp", "stock.nasdaq");
        fetchData("fmp", "forex");
        fetchData("alpaca", "stock.nasdaq");

        timeouts.push(setInterval(() => {
            fetchData("fmp", "stock.nasdaq");
        }, message.payload.interval));
        timeouts.push(setInterval(() => {
            fetchData("fmp", "forex");
        }, message.payload.interval));
        timeouts.push(setInterval(() => {
            fetchData("alpaca", "stock.nasdaq");
        }, message.payload.interval));
    }
    else if (message.type === 'stop') {
        for (let i = 0; i < timeouts.length; i++) {
            const timeout = timeouts[i];
            clearInterval(timeout);
            timeouts.splice(i, 1);
        }
    }
    else if (message.type === 'setassets') {
        const stockSymbols = await Fmp.getStockSymbols();
        const forexSymbols = await Fmp.getForexSymbols();

        if (stockSymbols && forexSymbols) {
            const mergedSymbols: Assets = { ...stockSymbols, ...forexSymbols };
            updateAssets(mergedSymbols);
            symbols = getSymbols();

            parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: true });
        }
        else {
            parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: false });
        }
    }
    else if (message.type === 'getpairprice') {
        if (message.payload.a && message.payload.b) {
            const a = getAssetPrice(message.payload.a);
            if (!a) {
                parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: null });
                return;
            }
            const b = getAssetPrice(message.payload.b);
            if (!b) {
                parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: null });
                return;
            }
            const pairPrice = getPairPrice(a, b, message.payload.abPrecision, message.payload.confPrecision);
            if (!pairPrice) {
                parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: null });
                return;
            }
            parentPort?.postMessage({ uuid: message.uuid, type: message.type, payload: pairPrice });
        }
    }
});
