import type { Result } from 'ts-results-es'

export * as Id from './id';
export * from './operators';
export * as Files from './module-loading';
export * from './functions';
export { SernError } from './structures/enums';
export { __Services } from './structures';
export { useContainerRaw } from './ioc/base';

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
