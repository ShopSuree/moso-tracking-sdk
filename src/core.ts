import { Logger } from "./logging";
import { IStorage } from "./storage/types";
import { Environment, SdkOptions, StorageType, TrackData } from "./types";
import { LocalStorageStore } from './storage/local-storage-store';
import { SessionStorageStore } from './storage/session-storage-store';
import { IdbStore } from "./storage/idb-store";
import { API_KEY } from './constants';

const getStorage = (key: string, logger: Logger, type: StorageType) => {

    if (type === "local-storage") {
        return new LocalStorageStore(key, logger);
    }

    if (type === "indexeddb") {
        return new IdbStore(key, logger);
    }

    if (type === "session-storage") {
        return new SessionStorageStore(key, logger);
    }

    throw new Error(`Storage type not supported.  Invalid Type: ${type}`)
}

const saveSubId = async (store: IStorage, sub_id: string) => {
    if (typeof sub_id === "string") {
        await store.setItem(sub_id);
    }
}

const saveCampaignId = async (store: IStorage, c_id: string) => {
    if (typeof c_id === "string") {
        await store.setItem(c_id);
    }
}

const getSubIdStore = (logger: Logger, type: StorageType) => {
    return getStorage("MOSO_AFFILIATE_SUB_ID", logger, type);
}

const getCampaignIdStore = (logger: Logger, type: StorageType) => {
    return getStorage("MOSO_AFFILIATE_C_ID", logger, type);
}

const getSdkEnvironment = (environment?: Environment | undefined) => {
    return environment ?? "development";
}

const getStorageType = (storageType?: StorageType | undefined) => {
    return storageType ?? "local-storage";
}

export const initialize = async (options: SdkOptions) => {
    const url = new URL(window.location.href);
    const environment = getSdkEnvironment(options.environment);
    const storageType = getStorageType(options.storage_type);

    const logger = new Logger(environment);
    const subIdStore = getSubIdStore(logger, storageType);
    const campaignIdStore = getCampaignIdStore(logger, storageType);

    logger.log(`Storage Type: ${storageType}`);

    if (url.searchParams.has('u_id') && url.searchParams.has('c_id')) {
        await saveSubId(subIdStore, url.searchParams.get('u_id'));
        await saveCampaignId(campaignIdStore, url.searchParams.get('c_id'));
        window.location.href = url.href.replace(url.search, '')
    }
}

export const getSubId = async (options: SdkOptions) => {
    const environment = getSdkEnvironment(options.environment);
    const storageType = getStorageType(options.storage_type);
    const logger = new Logger(environment);

    const subIdStore = getSubIdStore(logger, storageType)
    const campaignStore = getCampaignIdStore(logger, storageType)
    let subId = await subIdStore.getItem()
    let campaignId = await campaignStore.getItem()
    try {
        const resposne = await fetch(`https://staging.moso.xyz/web2/api/track`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sub_id: subId,
                client_id: campaignId
            })
        });

        if (resposne.ok === true) {
            return subId;
        }

        return null;
    } catch (e: any) {
        return null;
    }
}
export const track = async (
    options: SdkOptions,
    data: TrackData,
) => {
    const environment = getSdkEnvironment(options.environment);
    const storageType = getStorageType(options.storage_type);
    const logger = new Logger(environment);

    const campaignStore = getCampaignIdStore(logger, storageType);
    const clientId = await campaignStore.getItem();

    try {
        const response = await fetch('https://staging.moso.xyz/web2/webhook/post-back', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'API_KEY' : API_KEY
            },
            body: JSON.stringify({
                action: 'purchase',
                data: {
                    ...data,
                },
                source: window.location.href,
                clientId: clientId
            })
        });

        if (response.ok) {
            return true;
        }

        logger.log('Track request failed:', response.statusText);
        return false;
    } catch (e: any) {
        logger.log('Track request error:', e);
        return false;
    }
}