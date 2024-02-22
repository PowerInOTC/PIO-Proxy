import { Price, PriceResponse, Prices, RetrievedPrices } from '../types/price'
import Logger from '../utils/logger';
import { priceToPreparedPrice } from '../utils/priceUtils';

const assetPrices: Prices = {};

function updateAssetPrices(newPrices: RetrievedPrices): void {
    for (const [assetName, priceInfo] of Object.entries(newPrices)) {
        if (assetPrices[assetName] && assetPrices[assetName].providerPrices[priceInfo.provider] && assetPrices[assetName].providerPrices[priceInfo.provider].timestamp && assetPrices[assetName].providerPrices[priceInfo.provider].timestamp > priceInfo.timestamp) {
            Logger.warn('app', `[updateAssetPrices] | Unable to update asset ${assetName} - Old publishTime: ${assetPrices[assetName].providerPrices[priceInfo.provider].timestamp} New publishTime ${priceInfo.timestamp}`);
        }
        else {
            if (!assetPrices[assetName]) {
                assetPrices[assetName] = {
                    symbol: assetName, type: priceInfo.type, providerPrices: { [priceInfo.provider]: { bidPrice: priceInfo.bidPrice, askPrice: priceInfo.askPrice, timestamp: priceInfo.timestamp } }
                };
            }
            else {
                assetPrices[assetName].providerPrices[priceInfo.provider] = { bidPrice: priceInfo.bidPrice, askPrice: priceInfo.askPrice, timestamp: priceInfo.timestamp };
            }
        }
    }
}

function getAssetPrices(ids: string[] | null): PriceResponse {
    let selectedPrices: PriceResponse = {};
    if (ids == null) {
        for (const [assetName, priceInfo] of Object.entries(assetPrices)) {
            const preparedPrice = priceToPreparedPrice(priceInfo);
            if (preparedPrice && preparedPrice.price) {
                selectedPrices[assetName] = preparedPrice
            }
        }
    }
    else {
        ids.forEach((symbol: string) => {
            if (assetPrices[symbol]) {
                const preparedPrice = priceToPreparedPrice(assetPrices[symbol]);
                if (preparedPrice && preparedPrice.price) {
                    selectedPrices[symbol] = preparedPrice;
                }
            }
        })
    }
    return selectedPrices;
}

export { assetPrices, updateAssetPrices, getAssetPrices };