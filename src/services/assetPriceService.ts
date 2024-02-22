import { Price, PriceResponse, Prices, RetrievedPrices } from '../types/price'
import Logger from '../utils/logger';
import priceEventEmitter from '../events/priceEvent';
import { priceToPreparedPrice } from '../utils/priceUtils';

const assetPrices: Prices = {};

function updateAssetPrices(newPrices: RetrievedPrices): void {
    for (const [assetName, priceInfo] of Object.entries(newPrices)) {
        if (assetPrices[assetName] && assetPrices[assetName].providerPrices[priceInfo.provider] && assetPrices[assetName].providerPrices[priceInfo.provider].timestamp && assetPrices[assetName].providerPrices[priceInfo.provider].timestamp > priceInfo.timestamp) {
            Logger.warn('app', `[updateAssetPrices] | Unable to update asset ${assetName} - Old publishTime: ${assetPrices[assetName].providerPrices[priceInfo.provider].timestamp} New publishTime ${priceInfo.timestamp}`);
        }
        else {
            const newPrice: Price = {
                symbol: assetName, type: priceInfo.type, providerPrices: { [priceInfo.provider]: { bidPrice: priceInfo.bidPrice, askPrice: priceInfo.askPrice, timestamp: priceInfo.timestamp } }
            }
            assetPrices[assetName] = newPrice;
            priceEventEmitter.emit('pricesUpdated', newPrice);
        }
    }
}

function getAssetPrices(ids: string[] | null): PriceResponse {
    let selectedPrices: PriceResponse = {};
    if (ids == null) {
        for (const [assetName, priceInfo] of Object.entries(assetPrices)) {
            selectedPrices[assetName] = priceToPreparedPrice(priceInfo);
        }
    }
    else {
        ids.forEach((symbol: string) => {
            if (assetPrices[symbol]) {
                selectedPrices[symbol] = priceToPreparedPrice(assetPrices[symbol]);
            }
        })
    }
    return selectedPrices;
}

export { assetPrices, updateAssetPrices, getAssetPrices };