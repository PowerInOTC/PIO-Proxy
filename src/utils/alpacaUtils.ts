import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { handleFunctionError } from './sharedUtils';
import { config } from '../config';
import { RetrievedPrices } from '../types/price';
import { AlpacaPrice, AlpacaResponse } from '../types/alpaca';

class Alpaca {
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

            const filteredSymbols = Object.entries(types)
                .filter(([_, assetType]) => assetType === "stock.nasdaq" || assetType === "stock.nyse" || assetType === "stock.amex")
                .map(([assetName, _]) => assetName);

            const symbolsString = filteredSymbols.join(',');

            if (!symbolsString) {
                return {};
            }

            const headers = {
                'Content-Type': 'application/json',
                'APCA-API-KEY-ID': config.alpacaKey,
                'APCA-API-SECRET-KEY': config.alpacaSecret,
            };

            let apiUrl = 'https://data.alpaca.markets/v2/stocks/quotes/latest';
            apiUrl += `?symbols=${symbolsString}`;

            const response: AxiosResponse<AlpacaResponse> = await axios.get(apiUrl, { headers: headers, timeout: 2000 });

            const prices: RetrievedPrices = {};

            Object.entries(response.data.quotes).forEach(([symbol, stock]: [string, AlpacaPrice]) => {
                if (stock.bp && stock.ap) {
                    let timestamp = new Date(stock.t).getTime();
                    if (timestamp < 1000000000000) {
                        timestamp = Math.floor(timestamp * 1000)
                    }
                    prices[types[symbol.toUpperCase()] + "." + symbol.toUpperCase()] = { symbol: symbol.toUpperCase(), type: types[symbol.toUpperCase()], bidPrice: stock.bp.toString(), askPrice: stock.ap.toString(), provider: "alpaca", timestamp: timestamp };
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
}

export default Alpaca;
