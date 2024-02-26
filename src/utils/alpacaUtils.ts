import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { handleFunctionError } from './sharedUtils';
import { config } from '../config';
import { RetrievedPrices } from '../types/price';
import { AlpacaPrice, AlpacaResponse } from '../types/alpaca';
import { splitSymbols } from './priceUtils';

class Alpaca {
    public static async getLatestPrices(type: string, symbols: string[]): Promise<RetrievedPrices | null> {
        try {
            const baseUrl = 'https://data.alpaca.markets/v2/stocks/quotes/latest';
            //No limits of symbols for Alpaca
            const symbolsChunks = splitSymbols(symbols, 10000);
            const urls = symbolsChunks.map(chunk => `${baseUrl}?symbols=${chunk}`);

            const requestsConfig: AxiosRequestConfig[] = urls.map(url => ({
                method: 'GET',
                url: url,
                headers: {
                    'Content-Type': 'application/json',
                    'APCA-API-KEY-ID': config.alpacaKey,
                    'APCA-API-SECRET-KEY': config.alpacaSecret,
                },
                timeout: 2000
            }));

            const responses = await axios.all(requestsConfig.map(config => axios(config)));

            const prices: RetrievedPrices = {};
            responses.forEach((response) => {
                const data: AlpacaResponse = response.data;

                Object.entries(data.quotes).forEach(([symbol, stock]: [string, AlpacaPrice]) => {
                    if (stock.bp && stock.ap) {
                        let timestamp = new Date(stock.t).getTime();
                        if (timestamp < 1000000000000) {
                            timestamp = timestamp * 1000;
                        }
                        prices[type + "." + symbol.toUpperCase()] = { symbol: symbol.toUpperCase(), type: type, bidPrice: stock.bp.toString(), askPrice: stock.ap.toString(), provider: "alpaca", timestamp: timestamp };
                    }
                });
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
