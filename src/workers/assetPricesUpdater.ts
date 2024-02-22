import PythHermes from '../utils/pythHermesUtils';
import Fmp from '../utils/fmpUtils';
import { parentPort } from 'worker_threads';
import { WorkerMessage } from '../types/worker';
import { loadAssetsFromFile, getAssetPriceFeeds } from '../services/assetsService';
import { updateAssetPrices, getAssetPrices } from '../services/assetPriceService';

let priceFeeds: string[] | null = null
let timeouts: NodeJS.Timeout[] = [];

async function fetchData(type: string) {
    try {
        let data = null;
        if (type == "crypto" && priceFeeds) {
            data = await PythHermes.getLatestPrices("crypto", priceFeeds);
        }
        else if (type == "stock.nasdaq" || type == "forex") {
            data = await Fmp.getLatestPrices(type);
        }
        if (data) {
            updateAssetPrices(data);
        }
    } catch (error) {
        parentPort?.postMessage({ type: 'error', payload: error });
    }
}

parentPort?.on('message', (message: WorkerMessage) => {
    if (message.type === 'start') {
        timeouts.push(setInterval(() => {
            fetchData("crypto");
        }, message.payload.interval));
        timeouts.push(setInterval(() => {
            fetchData("stock.nasdaq");
        }, message.payload.interval));
        timeouts.push(setInterval(() => {
            fetchData("forex");
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
        loadAssetsFromFile('./config/assets.json');
    }
    else if (message.type === 'setpricefeeds') {
        priceFeeds = getAssetPriceFeeds();
    }
    else if (message.type === 'getprices') {
        if (message.payload.ids && message.payload.ids.length > 0) {
            const prices = getAssetPrices(message.payload.ids)
            parentPort?.postMessage({ uuid: message.uuid, type: 'getpricesresult', payload: prices });
        }
        else {
            const prices = getAssetPrices(null);
            parentPort?.postMessage({ uuid: message.uuid, type: 'getpricesresult', payload: prices });
        }
    }
});
