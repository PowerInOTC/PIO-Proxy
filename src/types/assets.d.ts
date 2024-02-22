type Assets = {
    [assetType: string]: AssetType
}

type AssetType = {
    [assetSymbol: string]: Asset;
}

type Asset = {
    brokers: string[];
    requirements: {
        [key: string]: Requirement;
    };
    priceFeedID: string;
    maxDelay: number;
    maxVolatility: number;
    minConfidenceInterval: number;
    expiryA: number;
    expiryB: number;
    timeLockA: number;
    timeLockB: number;
    tradingViewId: string;
}

type Requirement = {
    df_rate: number;
    max_leverage: number;
    initialMarginA: number;
    initialMarginB: number;
    defaultFundA: number;
    defaultFundB: number;
    bOracleIdL: number;
    bOracleIdS: number;
}

export { Assets, AssetType, Asset, Requirement };