import { EventType, SdkOptions } from './types';
import { initialize, recordEvent } from './core';

export { Environment, StorageType, SdkOptions, EventType } from './types';

export class Analytics {

    private readonly _options: SdkOptions;

    constructor(options: SdkOptions) {
        this._options = options;
        initialize(options);
    }

    async recordEvent(wallet_address: string, type: EventType) {
        return await recordEvent(wallet_address, type, this._options);
    }
}