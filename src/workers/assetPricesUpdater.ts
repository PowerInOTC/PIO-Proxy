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

const assetPairPriceCollection: { [uuid: string]: PairPrice } = {};
const requestLocks: { [uuid: string]: string } = {};

async function getPP(
  pAssetA: string,
  pAssetB: string,
  abPrecision: number,
  confPrecision: number,
  maxTimestampDiff: number,
): Promise<PairPrice | null> {
  const assetA: AssetVariable | null = formatAsset(pAssetA);
  const assetB: AssetVariable | null = formatAsset(pAssetB);

  if (!assetA || !checkAsset(assetA.prefix, assetA.assetName)) {
    return null;
  }

  if (!assetB || !checkAsset(assetB.prefix, assetB.assetName)) {
    return null;
  }

  let assetPrices: Prices = {};

  let fmpRes: RetrievedPrices | null = null;
  let retryCount = 0;

  while (!fmpRes && retryCount < 3) {
    fmpRes = await Fmp.getLatestPrices([assetA, assetB]);
    retryCount++;
  }

  if (!fmpRes) {
    return null;
  }

  assetPrices = updateAssetPrices(assetPrices, fmpRes);

  const a = assetPrices[assetA.prefix + '.' + assetA.assetName];
  const b = assetPrices[assetB.prefix + '.' + assetB.assetName];

  if (!a || !b) {
    return null;
  }

  const pairPrice = getPairPrice(
    a,
    b,
    abPrecision,
    confPrecision,
    maxTimestampDiff,
  );

  if (!pairPrice) {
    return null;
  }

  return pairPrice;
}

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
    if (message.payload.uuid) {
      if (!requestLocks[message.payload.uuid]) {
        requestLocks[message.payload.uuid] === 'locked';
        const pp = await getPP(
          message.payload.assetA,
          message.payload.assetB,
          message.payload.abPrecision,
          message.payload.confPrecision,
          message.payload.maxTimestampDiff,
        );
        if (!pp) {
          requestLocks[message.payload.uuid] = 'canceled';
        } else {
          assetPairPriceCollection[message.payload.uuid] = pp;
          requestLocks[message.payload.uuid] = 'unlocked';
        }
        setTimeout(() => {
          delete requestLocks[message.payload.uuid];
          delete assetPairPriceCollection[message.payload.uuid];
        }, 30000);
      } else if (requestLocks[message.payload.uuid] === 'locked') {
        await waitForUnlockOrCancel(message.payload.uuid);
      }
      if (
        !requestLocks[message.payload.uuid] ||
        requestLocks[message.payload.uuid] === 'canceled' ||
        !assetPairPriceCollection[message.payload.uuid]
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

    const pp = await getPP(
      message.payload.assetA,
      message.payload.assetB,
      message.payload.abPrecision,
      message.payload.confPrecision,
      message.payload.maxTimestampDiff,
    );
    if (!pp) {
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
      payload: pp,
    });
  }
});
