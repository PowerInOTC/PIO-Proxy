import BigNumber from "bignumber.js";
import { PreparedPrice, Price } from "../types/price";
import { handleFunctionError } from "./sharedUtils";

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

export function priceToPreparedPrice(price: Price): PreparedPrice | null {
    try {
        let totalRealPrice = new BigNumber(0);
        let numberOfProviders = 0;
        let minRealPrice = new BigNumber(Infinity);
        let maxRealPrice = new BigNumber(-Infinity);
        let oldestTimestamp = 0

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

        if (!numberOfProviders || totalRealPrice == new BigNumber(0) || !oldestTimestamp) {
            return null;
        }
        const lastPrice = totalRealPrice.dividedBy(numberOfProviders);

        const percentageDifference = maxRealPrice.minus(minRealPrice).div(minRealPrice);
        const confidence = BigNumber(1).minus(percentageDifference);
        const roundedConfidence = confidence.decimalPlaces(4, BigNumber.ROUND_DOWN);

        return { symbol: price.symbol, type: price.type, price: lastPrice.toString(), confidence: roundedConfidence.toNumber(), timestamp: oldestTimestamp };
    } catch (error) {
        if (error instanceof Error) {
            handleFunctionError('app', 'priceToPreparedPrice', `Caught an error: ${error.message}`);
        }

        return null;
    }
}