export type FmpPrice = {
  bidSize: number;
  askPrice: number;
  volume: number;
  askSize: number;
  bidPrice: number;
  lastSalePrice: number;
  lastSaleSize: number;
  lastSaleTime: number;
  fmpLast: number;
  lastUpdated: number;
  symbol: string;
};

export type FmpAssetSymbol = {
  symbol: string;
  name: string;
  price: number;
  exchange: string;
  exchangeShortName: string;
  type: string;
};

export type FmpForexSymbol = {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
};
