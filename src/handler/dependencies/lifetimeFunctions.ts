
export function single<T>(cb: () => T) {
    return cb;
}

export function transient<T>(cb: () => () => T) {
    return cb;
}