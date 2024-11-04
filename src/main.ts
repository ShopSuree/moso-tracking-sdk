import { SdkOptions } from "./types";
import {getSubId, initialize} from './core';

((options: SdkOptions) => {

    initialize(options);

    (window as any).moso = {
        getSubId: () => getSubId(options),
    }

})({
    api_key: "",
    storage_type: "session-storage",
    environment: "production"
})
