import { Logger } from "../logging";
import { IStorage } from "./types";

declare var window: any;

export class LocalStorageStore implements IStorage {

    private _localValue: string | null;
    private readonly _key: string;
    private readonly _logger: Logger;

    constructor(key: string, logger: Logger) {
        logger.log('Using Local Storage');
        this._key = key;
        this._localValue = null;
        this._logger = logger;
    }

    async getItem() {
        const existing = window.localStorage.getItem(this._key);

        if (existing == null && this._localValue != null) {
            this._logger.log('Existing item is null, returning in-memory item');
            return this._localValue;
        }

        return existing
    }

    async setItem(value: string) {
        window.localStorage.setItem(this._key, value);
        this._localValue = value;
    }

    async removeItem() {
        window.localStorage.removeItem(this._key);
        this._localValue = null;
    }

}