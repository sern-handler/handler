import { IntoDependencies } from '../../types/ioc';
import { Service as __Service, Services as __Services } from './global'
export { makeDependencies } from './base';


/**
 * The new Service api, a cleaner alternative to useContainer
 * To obtain intellisense, ensure a .d.ts file exists in the root of compilation.
 * Usually our scaffolding tool takes care of this.
 * Note: this method only works AFTER your container has been initiated
 * @since 3.0.0
 * @example
 * ```ts
 * const client = Service('@sern/client');
 * ```
 * @param key a key that corresponds to a dependency registered.
 *
 */
export function Service<const T extends keyof Dependencies>(key: T) {
    return __Service(key) as Dependencies[T]
}
/**
 * @since 3.0.0
 * The plural version of {@link Service}
 * @returns array of dependencies, in the same order of keys provided
 */
export function Services<const T extends (keyof Dependencies)[]>(...keys: [...T]) {
    return __Services<T, IntoDependencies<T>>(...keys)
}

/**
 * @deprecated
 * Creates a singleton object.
 * @param cb
 */
export function single<T>(cb: () => T) { 
    console.log('The `single` function is deprecated and has no effect')
    return cb(); 
}

/**
 * @deprecated
 * @since 2.0.0
 * Creates a transient object
 * @param cb
 */
export function transient<T>(cb: () => () => T) { 
    console.log('The `transient` function is deprecated and has no effect')
    return cb()(); 
}

