import { EventType, SdkOptions } from "./types";
import { initialize, recordEvent, recordClick } from './core';

((options: SdkOptions) => {

    initialize(options);

    (window as any).moso = {
        recordEvent: (wallet_address: string, type: EventType) => recordEvent(wallet_address, type, options),
        recordClick: (url?: string) => recordClick(options, url)
    }

})({
    api_key: ""
})
