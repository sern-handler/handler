export interface ImportPayload<T> {
    module: T;
    absPath: string;
    [key: string]: unknown;
}

export interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
    /**
     * @deprecated
     */
    mode?: string
    /*
     * @deprecated
     */
    containerConfig?: {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    };
}
