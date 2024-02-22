import axios, { AxiosResponse, AxiosError } from 'axios';
import { handleFunctionError } from './sharedUtils';
import { config } from '../config';
import { FmpPrice } from '../types/fmp';
import { RetrievedPrices } from '../types/price';
import { getSymbols } from '../services/assetsService';

class Fmp {
    public static async getLatestPrices(type: string): Promise<RetrievedPrices | null> {
        try {
            const symbols = getSymbols(type);

            const headers = {
                'Content-Type': 'application/json',
            };

            let apiUrl = 'https://financialmodelingprep.com/api/v3';
            apiUrl += `/stock/full/real-time-price?apikey=${config.fmpKey}`;

            const response: AxiosResponse<FmpPrice[]> = await axios.get(apiUrl, { headers: headers, timeout: 5000 });

            const prices: RetrievedPrices = {};

            const filteredStockData: FmpPrice[] = response.data.filter(item => symbols.includes(item.symbol));

            filteredStockData.forEach((stock: FmpPrice) => {
                if (stock.bidPrice && stock.askPrice) {
                    let timestamp: number = stock.lastUpdated;
                    if (type != "forex") {
                        timestamp = Math.floor(timestamp / 1000)
                    }
                    prices[type + "." + stock.symbol.toUpperCase()] = { symbol: stock.symbol.toUpperCase(), type: type, bidPrice: stock.bidPrice.toString(), askPrice: stock.askPrice.toString(), provider: "fmp", timestamp: timestamp };
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

export default Fmp;
