import BigNumber from "bignumber.js";
import { PreparedPrice, Price } from "../types/price";

export function formatNumberWithDecimals(inputNumber: string, decimalAmount: number): string {
    if (decimalAmount === 0) {
        return inputNumber;
    }

    while (inputNumber.length <= decimalAmount) {
        inputNumber = '0' + inputNumber;
    }

    const decimalIndex = inputNumber.length - decimalAmount;
    const formattedNumber = inputNumber.slice(0, decimalIndex) + '.' + inputNumber.slice(decimalIndex);

    return formattedNumber;
}

export function removePercentage(num: BigNumber, percentage: number): BigNumber {
    if (percentage < 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
    }

    const factor = new BigNumber(1).minus(percentage / 100);

    const result = num.times(factor);

    return result;
}

export function priceToPreparedPrice(price: Price): PreparedPrice {
    let totalRealPrice = new BigNumber(0);
    let numberOfProviders = 0;
    let minRealPrice = new BigNumber(Infinity);
    let maxRealPrice = new BigNumber(-Infinity);
    let oldestTimestamp = 0

    // Iterate over all provider prices
    for (const provider in price.providerPrices) {
        if (price.providerPrices.hasOwnProperty(provider)) {
            const providerPrice = price.providerPrices[provider];

            const bid = new BigNumber(providerPrice.bidPrice);
            const ask = new BigNumber(providerPrice.askPrice);

            const realPrice = bid.plus(ask).dividedBy(2);

            minRealPrice = BigNumber.min(minRealPrice, realPrice);
            maxRealPrice = BigNumber.max(maxRealPrice, realPrice);

            totalRealPrice = totalRealPrice.plus(realPrice);
            numberOfProviders++;

            if (oldestTimestamp == 0 || oldestTimestamp > providerPrice.timestamp) {
                oldestTimestamp = providerPrice.timestamp;
            }
        }
    }

    const lastPrice = numberOfProviders > 0 ? totalRealPrice.dividedBy(numberOfProviders) : new BigNumber(0);

    const confidence = maxRealPrice.minus(minRealPrice);

    return { symbol: price.symbol, type: price.type, price: lastPrice.toString(), confidence: confidence.toString(), timestamp: oldestTimestamp };
}