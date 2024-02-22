import * as fs from 'fs';
import { Assets } from '../types/assets'
import { handleFunctionError } from '../utils/sharedUtils';

let assets: Assets = {};

export function updateAssets(newAssets: Assets): void {
    assets = newAssets
}

export async function loadAssetsFromFile(filePath: string) {
    try {
        assets = {}
        const jsonString = fs.readFileSync(filePath, 'utf8');
        updateAssets(JSON.parse(jsonString));
        return true;
    } catch (error) {
        if (error instanceof Error) {
            handleFunctionError('app', 'loadAssetsFromFile', `Caught an error: ${error.message}`)
        }

        return false;
    }
}

export function getAssets(): Assets {
    return assets;
}

export function getAssetSymbolFromId(type: string, id: string): string | null {
    if (!assets[type]) {
        return null;
    }

    for (const assetName in assets[type]) {
        if (id == assets[type][assetName].priceFeedID) {
            return assetName;
        }
    }

    return null;
}

export function getAssetPriceFeeds(): string[] {
    const addresses: string[] = [];
    for (const assetType in assets) {
        for (const assetName in assets[assetType]) {
            addresses.push(assets[assetType][assetName].priceFeedID);
        }
    }
    return addresses;
}

export function getSymbols(assetType?: string): string[] {
    const assetSymbols: string[] = [];

    if (!assetType) {
        for (const assetTypeKey in assets) {
            const assetTypeObj = assets[assetTypeKey];
            for (const assetSymbol in assetTypeObj) {
                assetSymbols.push(assetSymbol);
            }
        }
    } else {
        if (assets.hasOwnProperty(assetType)) {
            const assetTypeObj = assets[assetType];
            for (const assetSymbol in assetTypeObj) {
                assetSymbols.push(assetSymbol);
            }
        }
    }

    return assetSymbols;
}
