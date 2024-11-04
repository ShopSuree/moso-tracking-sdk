import { SdkOptions } from "./types";
import {getSubId, initialize} from './core';

((options: SdkOptions) => {

    initialize(options);

    (window as any).mosoAffiliate = {
        getSubId: () => getSubId(options),
    }

})({
    api_key: "",
    storage_type: "session-storage",
    environment: "production"
})
