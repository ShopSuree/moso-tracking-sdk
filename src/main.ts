import { SdkOptions, TrackData } from "./types";
import {getSubId, initialize, track} from './core';

((options: SdkOptions) => {

    initialize(options);

    (window as any).mosoAffiliate = {
        getSubId: () => getSubId(options),
        track: (data: TrackData) => track(options, data),

    }

})({
    api_key: "",
    storage_type: "session-storage",
    environment: "production"
})
