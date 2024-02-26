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

export type Prices = {
    [assetName: string]: Price;
}

export type Price = {
    symbol: string;
    type: string;
    providerPrices: { [provider: string]: ProviderPrices };
}

export type ProviderPrices = {
    bidPrice: string;
    askPrice: string;
    timestamp: number;
}

export type PairPrice = {
    assetA: string;
    assetB: string;
    pairBid: string;
    pairAsk: string;
    confidence: string;
    timestamp: number;
}
