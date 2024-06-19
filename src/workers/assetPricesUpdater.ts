import { EventEmitter } from 'events';
import { parentPort } from 'worker_threads';
import Fmp from '../utils/fmpUtils';
import { WorkerMessage } from '../types/worker';
import { PairPrice, Prices, RetrievedPrices } from '../types/price';
import {
  formatAsset,
  getPairPrice,
  updateAssetPrices,
} from '../utils/priceUtils';
import { AssetVariable, Assets } from '../types/assets';
import { checkAsset, updateAssets } from '../services/assetsService';

const eventEmitter = new EventEmitter();

const assetPairPriceCollection: { [uuid: string]: PairPrice } = {};
const requestLocks: { [uuid: string]: string } = {};

async function waitForUnlockOrCancel(uuid: string): Promise<void> {
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      const status = requestLocks[uuid];
      if (!status || status === 'unlocked' || status === 'canceled') {
        clearInterval(intervalId);
        resolve();
      }
    }, 10);
  });
}

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
    if (message.payload.uuid && !requestLocks[message.payload.uuid]) {
      requestLocks[message.payload.uuid] === 'locked';
      setTimeout(() => {
        delete requestLocks[message.payload.uuid];
        delete assetPairPriceCollection[message.payload.uuid];
      }, 30000);
    } else if (
      message.payload.uuid &&
      requestLocks[message.payload.uuid] &&
      requestLocks[message.payload.uuid] === 'locked'
    ) {
      await waitForUnlockOrCancel(message.payload.uuid);
      if (
        !requestLocks[message.payload.uuid] ||
        requestLocks[message.payload.uuid] === 'canceled'
      ) {
        parentPort?.postMessage({
          uuid: message.uuid,
          type: 'resultError',
          payload: `Unable to fetch prices`,
        });
        return;
      }
      parentPort?.postMessage({
        uuid: message.uuid,
        type: message.type,
        payload: assetPairPriceCollection[message.payload.uuid],
      });
      return;
    }

    const assetA: AssetVariable | null = formatAsset(message.payload.assetA);
    const assetB: AssetVariable | null = formatAsset(message.payload.assetB);

    if (!assetA || !checkAsset(assetA.prefix, assetA.assetName)) {
      if (message.payload.uuid && requestLocks[message.payload.uuid]) {
        requestLocks[message.payload.uuid] = 'canceled';
      }
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: `${message.payload.assetA} doesn't exists`,
      });
      return;
    }

    if (!assetB || !checkAsset(assetB.prefix, assetB.assetName)) {
      if (message.payload.uuid && requestLocks[message.payload.uuid]) {
        requestLocks[message.payload.uuid] = 'canceled';
      }
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: `${message.payload.assetB} doesn't exists`,
      });
      return;
    }

    let assetPrices: Prices = {};

    let fmpRes: RetrievedPrices | null = null;
    let retryCount = 0;

    while (!fmpRes && retryCount < 3) {
      fmpRes = await Fmp.getLatestPrices([assetA, assetB]);
      retryCount++;
    }

    if (!fmpRes) {
      if (message.payload.uuid && requestLocks[message.payload.uuid]) {
        requestLocks[message.payload.uuid] = 'canceled';
      }
      parentPort?.postMessage({
        uuid: message.uuid,
        type: 'resultError',
        payload: 'Unable to fetch prices',
      });
      return;
    }

    assetPrices = updateAssetPrices(assetPrices, fmpRes);

    const a = assetPrices[assetA.prefix + '.' + assetA.assetName];
    const b = assetPrices[assetB.prefix + '.' + assetB.assetName];

    if (!a || !b) {
      if (message.payload.uuid && requestLocks[message.payload.uuid]) {
        requestLocks[message.payload.uuid] = 'canceled';
      }
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
      if (message.payload.uuid && requestLocks[message.payload.uuid]) {
        requestLocks[message.payload.uuid] = 'canceled';
      }
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

    if (message.payload.uuid && requestLocks[message.payload.uuid]) {
      assetPairPriceCollection[message.payload.uuid] = pairPrice;
      requestLocks[message.payload.uuid] = 'unlocked';
    }
  }
});
