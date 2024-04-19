import Fmp from '../utils/fmpUtils';
import Alpaca from '../utils/alpacaUtils';
import { parentPort } from 'worker_threads';
import { WorkerMessage } from '../types/worker';
import { Prices, RetrievedPrices } from '../types/price';
import {
  formatAsset,
  getPairPrice,
  updateAssetPrices,
} from '../utils/priceUtils';
import { AssetVariable, Assets } from '../types/assets';
import { checkAsset, updateAssets } from '../services/assetsService';

parentPort?.on('message', async (message: WorkerMessage) => {
  if (message.type === 'setassets') {
    let stockSymbols: Assets | null = null;
    let forexSymbols: Assets | null = null;
    let retryCount = 0;

    while ((!stockSymbols || !forexSymbols) && retryCount < 3) {
      [stockSymbols, forexSymbols] = await Promise.all([
        Fmp.getStockSymbols(),
        Fmp.getForexSymbols(),
      ]);
      retryCount++;
    }

    if (stockSymbols && forexSymbols) {
      const mergedSymbols: Assets = { ...stockSymbols, ...forexSymbols };
      updateAssets(mergedSymbols);

      parentPort?.postMessage({
        uuid: message.uuid,
        type: message.type,
        payload: true,
      });
    } else {
      parentPort?.postMessage({
        uuid: message.uuid,
        type: message.type,
        payload: false,
      });
    }
  } else if (message.type === 'getpairprice') {
    const assetA: AssetVariable | null = formatAsset(message.payload.assetA);
    const assetB: AssetVariable | null = formatAsset(message.payload.assetB);

    if (!assetA || !checkAsset(assetA.prefix, assetA.assetName)) {
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: `${message.payload.assetA} doesn't exists`,
      });
      return;
    }

    if (!assetB || !checkAsset(assetB.prefix, assetB.assetName)) {
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: `${message.payload.assetB} doesn't exists`,
      });
      return;
    }

    let assetPrices: Prices = {};

    let fmpRes: RetrievedPrices | null = null;
    let alpacaRes: RetrievedPrices | null = null;
    let retryCount = 0;

    while ((!fmpRes || !alpacaRes) && retryCount < 3) {
      [fmpRes, alpacaRes] = await Promise.all([
        Fmp.getLatestPrices([assetA, assetB]),
        Alpaca.getLatestPrices([assetA, assetB]),
      ]);
      retryCount++;
    }

    if (!fmpRes || !alpacaRes) {
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: 'Unable to fetch prices',
      });
      return;
    }

    assetPrices = updateAssetPrices(assetPrices, fmpRes);
    assetPrices = updateAssetPrices(assetPrices, alpacaRes);

    const a = assetPrices[assetA.prefix + '.' + assetA.assetName];
    const b = assetPrices[assetB.prefix + '.' + assetB.assetName];

    if (!a || !b) {
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: 'Unable to get pair price',
      });
      return;
    }

    const pairPrice = getPairPrice(
      a,
      b,
      message.payload.abPrecision,
      message.payload.confPrecision,
      message.payload.maxTimestampDiff,
    );

    if (!pairPrice) {
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: 'Unable to get pair price',
      });
      return;
    }

    parentPort?.postMessage({
      uuid: message.uuid,
      type: message.type,
      payload: pairPrice,
    });
  }
});
