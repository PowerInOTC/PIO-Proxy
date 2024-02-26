import { Assets } from '../types/assets'

let assets: Assets = {};

export function updateAssets(newAssets: Assets): void {
    assets = newAssets;
}

export function getAssets(): Assets {
    return assets;
}

export function checkAsset(type: string, asset: string): boolean {
    if (assets[type] && assets[type][asset]) {
        return true;
    }
    return false;
}

export function getSymbols(assetType?: string): { [key: string]: string[] } {
    const assetSymbols: { [key: string]: string[] } = {};
    if (!assetType) {
        for (const assetTypeKey in assets) {
            const assetTypeObj = assets[assetTypeKey];
            for (const assetSymbol in assetTypeObj) {
                if (!assetSymbols[assetTypeKey]) {
                    assetSymbols[assetTypeKey] = [];
                }
                assetSymbols[assetTypeKey].push(assetSymbol);
            }
        }
    } else {
        for (const assetTypeKey in assets) {
            if (assetTypeKey.includes(assetType)) {
                const assetTypeObj = assets[assetTypeKey];
                for (const assetSymbol in assetTypeObj) {
                    if (!assetSymbols[assetTypeKey]) {
                        assetSymbols[assetTypeKey] = [];
                    }
                    assetSymbols[assetTypeKey].push(assetSymbol);
                }
            }
        }
    }

    return assetSymbols;
}

