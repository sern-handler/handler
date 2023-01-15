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
 * Following iti's singleton and transient implementation,
 * use transient if you want a new dependency every time your container getter is called
 * @param cb
 */
export function transient<T>(cb: () => () => T) {
    return cb;
}