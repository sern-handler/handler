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
     * Overload to enable mode in case developer does not use a .env file.
     */
    mode?: 'DEV' | 'PROD';
    /*
     * @deprecated
     */
    containerConfig?: {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    };
}
