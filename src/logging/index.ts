import { Environment } from "../types";

export class Logger {

    private readonly _environment: Environment;

    constructor(environment: Environment) {
        this._environment = environment;
    }

    log(...args: any[]) {
        if (this._environment !== "development") {
            return;
        }

        console.log("[Moso Analytics]", ...args);
    } 
}