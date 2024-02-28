type Assets = {
    [assetType: string]: AssetType
}

type AssetType = {
    [assetSymbol: string]: Asset;
}

type Asset = {
    symbol: string;
    name: string;
    exchangeShortName: string;
    type: string;
}

type AssetVariable = {
    prefix: string;
    assetName: string;
}

export { Assets, AssetType, Asset, AssetVariable };
