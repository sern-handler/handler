import { _const } from '../utilities/functions';
/**
 * New signature
 * @since 2.0.0
 * @param cb
 */
export function single<T extends () => unknown>(cb: T): T;
/**
 * @__PURE__
 * @since 2.0.0.
 * Please note that on intellij, the deprecation is for all signatures, which is unintended behavior (and
 * very annoying).
 * For future versions, ensure that single is being passed as a **callback!!**
 * @param cb
 */
export function single<T>(cb: T) {
    return () => cb;
}

/**
 * @__PURE__
 * @since 2.0.0
 * Following iti's singleton and transient implementation,
 * use transient if you want a new dependency every time your container getter is called
 * @param cb
 */
export function transient<T>(cb: (() => () => T) ) {
    return cb;
}
