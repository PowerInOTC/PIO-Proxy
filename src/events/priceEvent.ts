import { EventEmitter } from 'events';
import { Price } from '../types/price';

const priceEventEmitter = new EventEmitter();

export function onPricesUpdated(callback: (newPrice: Price) => void): void {
    priceEventEmitter.on('pricesUpdated', callback);
}

export default priceEventEmitter;
