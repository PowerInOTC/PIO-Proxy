import { Prices, RetrievedPrices, PairPrice, Price } from '../types/price'
import Logger from '../utils/logger';

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

function getAssetPrice(id: string): Price | null {
    if (assetPrices[id]) {
        return assetPrices[id];
    }
    return null;
}

function getAssetPrices(ids?: string[] | null): Prices {
    if (!ids) {
        return assetPrices;
    }
    else {
        let selectedPrices: Prices = {};
        ids.forEach((symbol: string) => {
            if (assetPrices[symbol]) {
                selectedPrices[symbol] = assetPrices[symbol];
            }
        })
        return selectedPrices;
    }
}

export { assetPrices, updateAssetPrices, getAssetPrices, getAssetPrice };