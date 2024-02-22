import axios, { AxiosResponse, AxiosError } from 'axios';
import { handleFunctionError } from './sharedUtils';
import { config } from '../config';
import { RetrievedPrices } from '../types/price';
import { AlpacaPrice, AlpacaResponse } from '../types/alpaca';
import { getSymbols } from '../services/assetsService';

class Alpaca {
    public static async getLatestPrices(type: string): Promise<RetrievedPrices | null> {
        try {
            const symbols = getSymbols(type);

            if (!symbols) {
                return null;
            }

            const headers = {
                'Content-Type': 'application/json',
                'APCA-API-KEY-ID': config.alpacaKey,
                'APCA-API-SECRET-KEY': config.alpacaSecret,
            };

            let apiUrl = 'https://data.alpaca.markets';
            apiUrl += '/v2/stocks/quotes/latest';
            apiUrl += '?symbols=';
            apiUrl += symbols.join(',');

            const response: AxiosResponse<AlpacaResponse> = await axios.get(apiUrl, { headers: headers, timeout: 5000 });

            const prices: RetrievedPrices = {};

            Object.entries(response.data.quotes).forEach(([symbol, stock]: [string, AlpacaPrice]) => {
                if (stock.bp && stock.ap) {
                    const timestamp = Math.floor(new Date(stock.t).getTime() / 1000);
                    prices[type + "." + symbol.toUpperCase()] = { symbol: symbol.toUpperCase(), type: type, bidPrice: stock.bp.toString(), askPrice: stock.ap.toString(), provider: "alpaca", timestamp: timestamp };
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
