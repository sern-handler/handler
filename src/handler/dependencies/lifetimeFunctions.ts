
/**
 * @deprecated
 * @param cb
 * Deprecated signature: please pass a callback instead of just a dependency
 */
export function single<T>(cb: T) : T
/**
 * Following iti's singleton and transient implementation,
 * use single if you want a singleton object
 * @param cb
 */
export function single<T>(cb: (() => T) | T) {
    if(typeof cb === 'function')
        return cb;
}
/**
 * @deprecated
 * @param cb
 * Deprecated signature
 */
export function transient<T>(cb: T) : () => () => T
/**
 * Following iti's singleton and transient implementation,
 * use transient if you want a new dependency every time your container getter is called
 * @param cb
 */
export function transient<T>(cb: (() => () => T) | T) {
    if(typeof cb !== 'function') return () => () => cb;
    return cb;
}