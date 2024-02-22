export type RetrievedPrice = {
    symbol: string;
    type: string;
    bidPrice: string;
    askPrice: string;
    provider: string;
    timestamp: number
}

export type RetrievedPrices = {
    [assetName: string]: RetrievedPrice;
}

export type Price = {
    symbol: string;
    type: string;
    providerPrices: { [provider: string]: ProviderPrices };
}

export type Prices = {
    [assetName: string]: Price;
}

export type ProviderPrices = {
    bidPrice: string;
    askPrice: string;
    timestamp: number;
}

export type PreparedPrice = {
    symbol: string;
    type: string;
    price: string;
    confidence: number;
    timestamp: number
}

export type PriceResponse = {
    [assetName: string]: PreparedPrice;
}
