import { _const } from '../utilities/functions';

type NotFunction =
    | string
    | number
    | boolean
    | null
    | undefined
    | bigint
    | readonly any[]
    | { apply?: never; [k: string]: any }
    | { call?: never; [k: string]: any };

/**
 * @deprecated
 * @param cb
 */
export function single<T extends NotFunction>(cb: T): () => T;
/**
 * New signature
 * @param cb
 */
export function single<T extends () => unknown>(cb: T): T;
/**
 * @__PURE__
 * Please note that on intellij, the deprecation is for all signatures, which is unintended behavior (and
 * very annoying).
 * For future versions, ensure that single is being passed as a **callback!!**
 * @param cb
 */
export function single<T>(cb: T) {
    if (typeof cb === 'function') return cb;
    return () => cb;
}
/**
 * @deprecated
 * @param cb
 * Deprecated signature
 */
export function transient<T extends NotFunction>(cb: T): () => () => T;
export function transient<T extends () => () => unknown>(cb: T): T;
/**
 * @__PURE__
 * Following iti's singleton and transient implementation,
 * use transient if you want a new dependency every time your container getter is called
 * @param cb
 */
export function transient<T>(cb: (() => () => T) | T) {
    if (typeof cb !== 'function') return () => () => cb;
    return cb;
}

/**
 * @__PURE__
 * @deprecated
 * @param value
 * Please use the transient function instead
 */
// prettier-ignore
export const many = <T>(value: T) => () => _const(value);
