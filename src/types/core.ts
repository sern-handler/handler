import { OnError } from "./core-modules";

export interface ImportPayload<T> {
    module: T;
    absPath: string;
    onError:  OnError
    [key: string]: unknown;
}

export interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
    /**
     * Overload to enable mode in case developer does not use a .env file.
     * @deprecated - https://github.com/sern-handler/handler/pull/325
     */
    mode?: string
    /*
     * @deprecated
     */
    containerConfig?: {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    };
}
