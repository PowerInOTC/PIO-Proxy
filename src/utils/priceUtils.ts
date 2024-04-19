import BigNumber from 'bignumber.js';
import { PairPrice, Price, Prices, RetrievedPrices } from '../types/price';
import { handleFunctionError } from './sharedUtils';
import Logger from '../utils/logger';
import { AssetVariable } from '../types/assets';

const markets = ['forex', 'stock.nasdaq', 'stock.nyse', 'stock.amex'];

export function updateAssetPrices(
  assetPrices: Prices,
  newPrices: RetrievedPrices,
): Prices {
  for (const [assetName, priceInfo] of Object.entries(newPrices)) {
    if (
      assetPrices[assetName] &&
      assetPrices[assetName].providerPrices[priceInfo.provider] &&
      assetPrices[assetName].providerPrices[priceInfo.provider].timestamp &&
      assetPrices[assetName].providerPrices[priceInfo.provider].timestamp >
        priceInfo.timestamp
    ) {
      Logger.warn(
        'app',
        `[updateAssetPrices] | Unable to update asset ${assetName} - Old publishTime: ${assetPrices[assetName].providerPrices[priceInfo.provider].timestamp} New publishTime ${priceInfo.timestamp}`,
      );
    } else {
      if (!assetPrices[assetName]) {
        assetPrices[assetName] = {
          symbol: assetName,
          type: priceInfo.type,
          providerPrices: {
            [priceInfo.provider]: {
              bidPrice: priceInfo.bidPrice,
              askPrice: priceInfo.askPrice,
              timestamp: priceInfo.timestamp,
            },
          },
        };
      } else {
        assetPrices[assetName].providerPrices[priceInfo.provider] = {
          bidPrice: priceInfo.bidPrice,
          askPrice: priceInfo.askPrice,
          timestamp: priceInfo.timestamp,
        };
      }
    }
  }

  return assetPrices;
}

export function formatNumberWithDecimals(
  inputNumber: string,
  decimalAmount: number,
): string {
  if (decimalAmount === 0) {
    return inputNumber;
  }

  while (inputNumber.length <= decimalAmount) {
    inputNumber = '0' + inputNumber;
  }

  const decimalIndex = inputNumber.length - decimalAmount;
  const formattedNumber =
    inputNumber.slice(0, decimalIndex) + '.' + inputNumber.slice(decimalIndex);

  return formattedNumber;
}

export function isAllowedMarket(input: string): boolean {
  return markets.includes(input.toLowerCase());
}

export function formatAsset(input: string): AssetVariable | null {
  for (const market of markets) {
    if (input.startsWith(`${market}.`)) {
      const marketLength = market.length;
      const prefix = input
        .substring(0, input.indexOf('.', marketLength))
        .toLowerCase();
      const assetName = input.substring(prefix.length + 1).toUpperCase();
      return { prefix, assetName };
    }
  }
  return null;
}

export function removePercentage(
  num: BigNumber,
  percentage: number,
): BigNumber {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  const factor = new BigNumber(1).minus(percentage / 100);

  const result = num.times(factor);

  return result;
}

export function checkPriceValue(price: string): boolean {
  if (price && price != '0' && /^[\d.]+$/.test(price)) {
    return true;
  }
  return false;
}

export function getLatestTimestampFromPrices(prices: Price[]): number | null {
  let maxTimestamp = -Infinity;
  for (const price of prices) {
    for (const provider in price.providerPrices) {
      if (
        Object.prototype.hasOwnProperty.call(price.providerPrices, provider)
      ) {
        const providerPrice = price.providerPrices[provider];
        if (
          checkPriceValue(providerPrice.bidPrice) &&
          checkPriceValue(providerPrice.askPrice)
        ) {
          if (maxTimestamp < providerPrice.timestamp) {
            maxTimestamp = providerPrice.timestamp;
          }
        }
      }
    }
  }
  if (maxTimestamp == -Infinity) {
    return null;
  }

  return maxTimestamp;
}

export function coefficientOfVariation(prices: BigNumber[]): BigNumber {
  const sumPrice = prices.reduce(
    (total, price) => total.plus(price),
    new BigNumber(0),
  );
  const priceMean = sumPrice.dividedBy(prices.length);
  const squaredDifferences = prices.map((price) =>
    price.minus(priceMean).pow(2),
  );
  const sumSquaredDifferences = squaredDifferences.reduce(
    (total, diff) => total.plus(diff),
    new BigNumber(0),
  );
  const averageSquaredDifference = sumSquaredDifferences.dividedBy(
    prices.length,
  );
  const standardDeviation = averageSquaredDifference.squareRoot();
  const coefficientOfVariation = standardDeviation.dividedBy(priceMean);

  return coefficientOfVariation;
}

export function getPriceEstimate(
  price: Price,
  allowedTimestamp: number,
): {
  bidPriceEstimate: BigNumber;
  askPriceEstimate: BigNumber;
  bidConfidence: BigNumber;
  askConfidence: BigNumber;
  timestamp: number;
} | null {
  const bidPrices: BigNumber[] = [];
  const askPrices: BigNumber[] = [];
  let minTimestamp = Infinity;
  let numberOfProviders = 0;

  for (const provider in price.providerPrices) {
    if (
      Object.prototype.hasOwnProperty.call(price.providerPrices, provider) &&
      price.providerPrices[provider].timestamp >= allowedTimestamp
    ) {
      const providerPrice = price.providerPrices[provider];
      if (
        checkPriceValue(providerPrice.bidPrice) &&
        checkPriceValue(providerPrice.askPrice)
      ) {
        if (minTimestamp > providerPrice.timestamp) {
          minTimestamp = providerPrice.timestamp;
        }
        bidPrices.push(new BigNumber(providerPrice.bidPrice));
        askPrices.push(new BigNumber(providerPrice.askPrice));
        numberOfProviders += 1;
      }
    }
  }

  if (numberOfProviders == 0) {
    return null;
  }

  const bidCoefficientOfVariation = coefficientOfVariation(bidPrices);
  const askCoefficientOfVariation = coefficientOfVariation(askPrices);
  const bidSumPrice = bidPrices.reduce(
    (total, price) => total.plus(price),
    new BigNumber(0),
  );
  const askSumPrice = askPrices.reduce(
    (total, price) => total.plus(price),
    new BigNumber(0),
  );
  const bidPriceEstimate = bidSumPrice.dividedBy(bidPrices.length);
  const askPriceEstimate = askSumPrice.dividedBy(bidPrices.length);

  return {
    bidPriceEstimate: bidPriceEstimate,
    askPriceEstimate: askPriceEstimate,
    bidConfidence: bidCoefficientOfVariation,
    askConfidence: askCoefficientOfVariation,
    timestamp: minTimestamp,
  };
}

export function getPairPrice(
  a: Price,
  b: Price,
  abPrecision: number,
  confPrecision: number,
  maxTimestampDiff: number,
): PairPrice | null {
  try {
    if (!a || !b) {
      return null;
    }

    const lastTimestamp = getLatestTimestampFromPrices([a, b]);

    if (!lastTimestamp) {
      return null;
    }

    const allowedTimestamp = lastTimestamp - maxTimestampDiff;

    const aEstimate = getPriceEstimate(a, allowedTimestamp);
    if (!aEstimate) {
      return null;
    }

    const bEstimate = getPriceEstimate(b, allowedTimestamp);
    if (!bEstimate) {
      return null;
    }

    let pairBid: string | null = null;
    let pairAsk: string | null = null;
    if (abPrecision || abPrecision == 0) {
      pairBid = aEstimate.bidPriceEstimate
        .dividedBy(bEstimate.bidPriceEstimate)
        .decimalPlaces(abPrecision, BigNumber.ROUND_HALF_UP)
        .toString();
      pairAsk = aEstimate.askPriceEstimate
        .dividedBy(bEstimate.askPriceEstimate)
        .decimalPlaces(abPrecision, BigNumber.ROUND_HALF_UP)
        .toString();
    } else {
      pairBid = aEstimate.bidPriceEstimate
        .dividedBy(bEstimate.bidPriceEstimate)
        .toString();
      pairAsk = aEstimate.askPriceEstimate
        .dividedBy(bEstimate.askPriceEstimate)
        .toString();
    }

    const oldestTimestamp = Math.min(aEstimate.timestamp, bEstimate.timestamp);

    const confidence = BigNumber.max(
      aEstimate.bidConfidence,
      aEstimate.askConfidence,
      bEstimate.bidConfidence,
      bEstimate.askConfidence,
    );

    let roundedConfidence: number | null = null;

    if (confPrecision || confPrecision == 0) {
      roundedConfidence = confidence
        .decimalPlaces(confPrecision, BigNumber.ROUND_DOWN)
        .toNumber();
    } else {
      roundedConfidence = confidence.toNumber();
    }

    return {
      assetA: a.symbol,
      assetB: b.symbol,
      pairBid: pairBid,
      pairAsk: pairAsk,
      confidence: roundedConfidence.toString(),
      timestamp: oldestTimestamp,
    };
  } catch (error) {
    if (error instanceof Error) {
      handleFunctionError(
        'app',
        'getPairPrice',
        `Caught an error: ${error.message}`,
      );
    }

    return null;
  }
}
