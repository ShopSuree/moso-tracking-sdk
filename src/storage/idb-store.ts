import { Logger } from "../logging";
import { IStorage } from "./types";
import { openDB, DBSchema } from 'idb';

interface Idb extends DBSchema {
    'tracking': {
      key: string;
      value: string;
    };
  }

export class IdbStore implements IStorage {

    private readonly _key: string;
    private readonly _logger: Logger;

    constructor(key: string, logger: Logger) {
        logger.log('Using IndexedDB');
        this._key = key;
        this._logger = logger;
    }

    private async _resolveDb() {
        return await openDB<Idb>('MOSO_ANALYTICS', 1, {
            upgrade(db) {
                db.createObjectStore('tracking');
            },
        });
    }

    async getItem() {
        const db = await this._resolveDb();

        const result = await db.get("tracking", this._key);

        return result ?? null;
    }

    async setItem(value: string) {
        const db = await this._resolveDb();
        await db.put("tracking", value, this._key);
    }

    async removeItem() {
        const db = await this._resolveDb();
        await db.delete("tracking", this._key);
    }

}