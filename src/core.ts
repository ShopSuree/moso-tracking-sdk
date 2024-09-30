import { Logger } from "./logging";
import { IStorage } from "./storage/types";
import { Environment, EventType, ReferralLink, SdkOptions, StorageType } from "./types";
import { LocalStorageStore } from './storage/local-storage-store';
import { IdbStore } from "./storage/idb-store";

const allowedTypes: EventType[] = ["login"]

const getStorage = (key: string, logger: Logger, type: StorageType) => {

    if (type === "local-storage") {
        return new LocalStorageStore(key, logger);
    }

    if (type === "indexeddb") {
        return new IdbStore(key, logger);
    }

    throw new Error(`Storage type not supported.  Invalid Type: ${type}`)
}

const getLink = async (logger: Logger, store: IStorage) => {
    const link = await store.getItem();

    if (link == null) {
        logger.log('Link is missing');
        return null;
    }

    try {

        const result = JSON.parse(link);

        if ('link' in result && 'marketer_id' in result && 'timestamp' in result) {

            await store.removeItem();

            logger.log('Got link to record');

            return result as ReferralLink;
        }

        logger.log('Parse result is not valid')

        return null;

    } catch (e) {
        logger.log('Parse error')
        return null;
    }
}

const getSendTimestamp = async (store: IStorage) => {
    const value = await store.getItem();

    if (value == null) {
        return null;
    }

    const numericValue = Number(value);

    if (Number.isInteger(numericValue) == false) {
        await store.removeItem(); // remove bad value
        return null;
    }

    return numericValue;
}

const saveSendTimestamp = async (store: IStorage) => {
    await store.setItem(Date.now().toString());
}

const getDelta = (date: Date): number => {
    return (new Date() as any) - (date as any);
}

const saveLink = async (store: IStorage, link: string, marketer_id: string) => {
    if (typeof link === 'string' && Number.isInteger(Number(marketer_id))) {
        await store.setItem(JSON.stringify({ link, marketer_id, timestamp: Date.now() }));
    }
}

const getReferrerStore = (logger: Logger, type: StorageType) => {
    return getStorage("MOSO_AFFILIATE_REFERRER", logger, type);
}

const getTimestampStore = (logger: Logger, type: StorageType) => {
    return getStorage("MOSO_AFFILIATE_TIMESTAMP", logger, type);
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
    const referrerStore = getReferrerStore(logger, storageType);

    logger.log(`Storage Type: ${storageType}`);

    if (url.searchParams.has("m") && url.searchParams.has("source", "moso")) {
        await saveLink(referrerStore, window.location.href, url.searchParams.get("m")!);
    }
}

export const recordClick = async (options: SdkOptions, url?: string) => {

    const link = url ?? window.location.href;
    const resolvedUrl = new URL(url ?? window.location.href);
    const environment = getSdkEnvironment(options.environment);
    const logger = new Logger(environment);

    if (resolvedUrl.searchParams.has("mid") == false) {
        logger.log(`Missing mid`)
        return
    }

    if (resolvedUrl.searchParams.has("bid") == false) {
        logger.log(`Missing bid`)
        return
    }

    if (resolvedUrl.searchParams.has("blid") == false) {
        logger.log(`Missing blid`)
        return
    }

    try {
        const response = await fetch(`https://marketer.moso.xyz/api/v1/brand-links/click?api_key=${encodeURIComponent(options.api_key)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                link,
                wallet_address: "0xc22d2ee59a228dfa5d2286d41cc6b09f77016201",
                bid: resolvedUrl.searchParams.get("bid"),
                mid: resolvedUrl.searchParams.get("mid"),
                blid: resolvedUrl.searchParams.get("blid")
            })
        });

        if (response.ok === true) {
            logger.log('Request Sent');
            return;
        }

        logger.log('Unable to send request');
    } catch (e: any) {
        console.error(e);
    }
}

export const recordEvent = async (wallet_address: string, type: EventType, options: SdkOptions) => {
    if (allowedTypes.includes(type) === false) {
        throw new Error(`Record event not recognized.  Type: ${type}`);
    }

    const environment = getSdkEnvironment(options.environment);
    const storageType = getStorageType(options.storage_type);
    const logger = new Logger(environment);
    const referrerStore = getReferrerStore(logger, storageType);
    const timestampStore = getTimestampStore(logger, storageType);

    const found = await getLink(logger, referrerStore);

    if (found == null) {
        logger.log('No matching url to record');
        // no matching url's to record
        return Promise.resolve();
    }

    const delta = getDelta(new Date(found.timestamp));
    const expirationDays = 7;
    const expiration = 1000 * 60 * 60 * 24 * expirationDays;

    if (delta > expiration) {
        // do nothing if we have expired
        logger.log('Url to record has expired');
        return Promise.resolve();
    }

    const timestamp = await getSendTimestamp(timestampStore);

    if (timestamp != null) {
        const delta = getDelta(new Date(timestamp));

        if (delta <= 10000) {
            // do not keep sending tons of requests on refresh
            logger.log('Skipping for DDOS prevention');
            return Promise.resolve();
        }
    }

    // the last recorded link should be sent to us
    const { link, marketer_id } = found;

    // we only want to record specific links that contain search parameters
    // ex: https://space.id/?m=1&s=moso

    await saveSendTimestamp(timestampStore);

    try {
        const resposne = await fetch(`https://marketer.moso.xyz/api/v1/brand-links/click?api_key=${encodeURIComponent(options.api_key)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                link,
                wallet_address,
                marketer_id
            })
        });

        if (resposne.ok === true) {
            logger.log('Request Sent');
            return;
        }

        logger.log('Unable to send request');
    } catch (e: any) {
        console.error(e);
    }
}