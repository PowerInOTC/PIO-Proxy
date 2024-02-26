import axios, { AxiosResponse, AxiosError } from 'axios';
import { handleFunctionError } from './sharedUtils';
import { config } from '../config';
import { FmpAssetSymbol, FmpForexSymbol, FmpPrice } from '../types/fmp';
import { RetrievedPrices } from '../types/price';
import { Assets } from '../types/assets';

class Fmp {
    public static async getLatestPrices(symbols: string[]): Promise<RetrievedPrices | null> {
        try {
            const types: { [key: string]: string } = {};
            symbols.forEach(item => {
                const parts = item.split('.');
                const assetName = parts.pop();
                const assetType = parts.join('.');
                if (assetName && assetType) {
                    types[assetName] = assetType;
                }
            });

            const symbolsString = symbols.map(symbol => symbol.split('.').pop() || '').join(',');

            const headers = {
                'Content-Type': 'application/json',
            };

            let apiUrl = 'https://financialmodelingprep.com/api/v3';
            apiUrl += `/stock/full/real-time-price/${symbolsString}?apikey=${config.fmpKey}`;

            const response: AxiosResponse<FmpPrice[]> = await axios.get(apiUrl, { headers: headers, timeout: 2000 });

            const prices: RetrievedPrices = {};

            response.data.forEach((stock: FmpPrice) => {
                if (stock.bidPrice && stock.askPrice) {
                    let timestamp: number = stock.lastUpdated;
                    if (timestamp < 1000000000000) {
                        timestamp = Math.floor(timestamp * 1000)
                    }
                    prices[types[stock.symbol.toUpperCase()] + "." + stock.symbol.toUpperCase()] = { symbol: stock.symbol.toUpperCase(), type: types[stock.symbol.toUpperCase()], bidPrice: stock.bidPrice.toString(), askPrice: stock.askPrice.toString(), provider: "fmp", timestamp: timestamp };
                }
            });

            return prices;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                handleFunctionError('app', 'getLatestPrices', `Response status: ${axiosError.response?.status} - Response data: ` + JSON.stringify(axiosError.response?.data));
            }
            else if (error instanceof Error) {
                handleFunctionError('app', 'getLatestPrices', `Caught an error: ${error.message}`);
            }

            return null;
        }
    }
    public static async getStockSymbols(): Promise<Assets | null> {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            let apiUrl = 'https://financialmodelingprep.com/api/v3';
            apiUrl += `/available-traded/list?apikey=${config.fmpKey}`;

            const response: AxiosResponse<FmpAssetSymbol[]> = await axios.get(apiUrl, { headers: headers, timeout: 5000 });
            const assets: Assets = {};
            response.data.forEach((asset: FmpAssetSymbol) => {
                if (asset.symbol && asset.name && asset.exchangeShortName && asset.type) {
                    if (asset.exchangeShortName.toLowerCase() == "nyse" || asset.exchangeShortName.toLowerCase() == "nasdaq" || asset.exchangeShortName.toLowerCase() == "amex" || asset.exchangeShortName.toLowerCase() == "euronext") {
                        if (!assets[`${asset.type.toLowerCase()}.${asset.exchangeShortName.toLowerCase()}`]) {
                            assets[`${asset.type.toLowerCase()}.${asset.exchangeShortName.toLowerCase()}`] = {};
                        }
                        assets[`${asset.type.toLowerCase()}.${asset.exchangeShortName.toLowerCase()}`][asset.symbol.toUpperCase()] = { symbol: asset.symbol.toUpperCase(), name: asset.name.toUpperCase(), exchangeShortName: asset.exchangeShortName.toLowerCase(), type: asset.type.toLowerCase() }
                    }
                }
            });

            return assets;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                handleFunctionError('app', 'getStockSymbols', `Response status: ${axiosError.response?.status} - Response data: ` + JSON.stringify(axiosError.response?.data));
            }
            else if (error instanceof Error) {
                handleFunctionError('app', 'getStockSymbols', `Caught an error: ${error.message}`);
            }

            return null;
        }
    }
    public static async getForexSymbols(): Promise<Assets | null> {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            let apiUrl = 'https://financialmodelingprep.com/api/v3';
            apiUrl += `/symbol/available-forex-currency-pairs?apikey=${config.fmpKey}`;

            const response: AxiosResponse<FmpForexSymbol[]> = await axios.get(apiUrl, { headers: headers, timeout: 5000 });
            const assets: Assets = {};
            response.data.forEach((asset: FmpForexSymbol) => {
                if (asset.symbol && asset.name && asset.currency && asset.stockExchange && asset.exchangeShortName) {
                    if (!assets[asset.exchangeShortName.toLowerCase()]) {
                        assets[asset.exchangeShortName.toLowerCase()] = {};
                    }
                    assets[`${asset.exchangeShortName.toLowerCase()}`][asset.symbol.toUpperCase()] = { symbol: asset.symbol.toUpperCase(), name: asset.name, exchangeShortName: asset.exchangeShortName.toLowerCase(), type: asset.exchangeShortName.toLowerCase() }
                }
            });

            return assets;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                handleFunctionError('app', 'getForexSymbols', `Response status: ${axiosError.response?.status} - Response data: ` + JSON.stringify(axiosError.response?.data));
            }
            else if (error instanceof Error) {
                handleFunctionError('app', 'getForexSymbols', `Caught an error: ${error.message}`);
            }

            return null;
        }
    }
}

export default Fmp;
