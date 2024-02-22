import axios, { AxiosResponse, AxiosError } from 'axios';
import { handleFunctionError } from './sharedUtils';
import { formatNumberWithDecimals, removePercentage } from './priceUtils';
import { getAssetSymbolFromId } from '../services/assetsService';
import { RetrievedPrices } from '../types/price';
import BigNumber from 'bignumber.js';
import { PythPriceFeed } from '../types/pyth';

class PythHermes {
    public static async getLatestPrices(type: string, priceFeeds: string[]): Promise<RetrievedPrices | null> {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            const baseUrl = 'https://hermes.pyth.network/api/latest_price_feeds';
            const queryParams = priceFeeds.map((id) => `ids[]=${encodeURIComponent(id)}`).join('&');
            const apiUrl = `${baseUrl}?${queryParams}`;

            const response: AxiosResponse<PythPriceFeed[]> = await axios.get(apiUrl, { headers: headers, timeout: 5000 });

            const prices: RetrievedPrices = {};

            response.data.forEach((crypto: PythPriceFeed) => {
                if (crypto.price.price) {
                    const askPrice = formatNumberWithDecimals(crypto.price.price, -crypto.price.expo);
                    const bidPrice = removePercentage(new BigNumber(askPrice), 0.01).decimalPlaces(8, BigNumber.ROUND_FLOOR).toString()
                    const priceAddress = '0x' + crypto.id;
                    const assetName = getAssetSymbolFromId("crypto", priceAddress);
                    if (assetName) {
                        prices["crypto." + assetName] = { symbol: assetName, type: "crypto", bidPrice: bidPrice, askPrice: askPrice, provider: "pyth", timestamp: crypto.price.publish_time };
                    }
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

export default PythHermes;

/*import axios, { AxiosError } from 'axios';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { Prices } from '../types/price';
import { formatNumberWithDecimals, removePercentage } from './priceUtils';
import { getAssetSymbolFromId } from '../services/assetsService';
import { handleFunctionError } from '../utils/sharedUtils';
import BigNumber from 'bignumber.js';

class PythHermes {
    public static async getLatestPrices(priceFeedIds: string[]): Promise<Prices | null> {
        try {
            const connection = new PriceServiceConnection("https://hermes.pyth.network", {
                timeout: 1000,
                httpRetries: 0,
                priceFeedRequestConfig: {
                    binary: false,
                },
            });

            const response = await connection.getLatestPriceFeeds(priceFeedIds)
            if (response == undefined) {
                throw new Error('Response is undefined.');
            }

            const prices: Prices = {};
            for (const priceFeed of response) {
                if (priceFeed.getPriceUnchecked().price) {
                    const askPrice = formatNumberWithDecimals(priceFeed.getPriceUnchecked().price, -priceFeed.getPriceUnchecked().expo);
                    const bidPrice = removePercentage(new BigNumber(askPrice), 0.01).decimalPlaces(8, BigNumber.ROUND_FLOOR).toString()
                    const priceAddress = '0x' + priceFeed.id;
                    const assetName = getAssetSymbolFromId("crypto", priceAddress);
                    if (assetName) {
                        prices["crypto." + assetName] = { symbol: assetName, type: "crypto", bidPrice: bidPrice, askprice: askPrice, provider: "pyth", timestamp: priceFeed.getPriceUnchecked().publishTime };
                    }
                }
            }

            return prices
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

    public static async getLatestVaas(priceFeedIds: string[]): Promise<string[] | null> {
        try {
            const connection = new PriceServiceConnection("https://hermes.pyth.network", {
                timeout: 1000,
                httpRetries: 1,
                priceFeedRequestConfig: {
                    binary: false,
                },
            });

            const response = await connection.getLatestVaas(priceFeedIds)

            return response
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                handleFunctionError('app', 'getLatestVaas', `Response status: ${axiosError.response?.status} - Response data: ` + JSON.stringify(axiosError.response?.data));
            }
            else if (error instanceof Error) {
                handleFunctionError('app', 'getLatestVaas', `Caught an error: ${error.message}`);
            }

            return null;
        }
    }
}

export default PythHermes;
*/