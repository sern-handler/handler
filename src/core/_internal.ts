import type { Result } from 'ts-results-es'

export * from './functions';

export type _Module = {
    meta: {
        id: string,
        absPath: string
    }
    name: string,
    execute : Function
    [key: PropertyKey]: unknown
}

export type VoidResult = Result<void, void>;
