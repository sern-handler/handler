import assert from 'node:assert';
import type { IntoDependencies } from '../../types/ioc';
import { useContainerRaw } from './base';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { requir } from '../module-loading';
import type { Localization } from '../contracts';

/**
 * @__PURE__
 * @since 2.0.0.
 * Creates a singleton object.
 * @param cb
 */
export function single<T>(cb: () => T) {
    return cb;
}

/**
 * @__PURE__
 * @since 2.0.0
 * Creates a transient object
 * @param cb
 */
export function transient<T>(cb: () => () => T) {
    return cb;
}
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
    const dep = useContainerRaw().get(key)!;
    assert(dep, "Requested key " + key + " returned undefined");
    return dep;
}
/**
 * @since 3.0.0
 * The plural version of {@link Service}
 * @returns array of dependencies, in the same order of keys provided
 */
export function Services<const T extends (keyof Dependencies)[]>(...keys: [...T]) {
    const container = useContainerRaw();
    return keys.map(k => container.get(k)!) as IntoDependencies<T>;
}


export function useContainer<const T extends Dependencies>() {
    return <V extends (keyof T)[]>(...keys: [...V]) =>
        keys.map(key => useContainerRaw().get(key as keyof Dependencies)) as IntoDependencies<V>;
}

/**
  * Translates a string to its respective local
  * Note: this method only works AFTER your container has been initiated
  * @example
  * ```ts
  * assert.deepEqual(locals("salute.hello", "es"), "hola")
  * ```
  */
export const local  = (i: string, local: string) => {
    return Service('@sern/localizer').translate(i, local)
}

/**
  * Returns a record of locales to their respective translations.
  * Note: this method only works AFTER your container has been initiated
  * @example
  * ```ts
  * assert.deepEqual(localsFor("salute.hello"), { "en-US": "hello", "es": "hola" })
  * ```
  */
export const localsFor = (path: string) => {
    return Service('@sern/localizer').translationsFor(path) 
}
/**
 * A service which provides simple file based localization. Add this while making dependencies.
 * @example 
 *  ```ts
 *  await makeDependencies(({ add }) => {
 *      add('@sern/localizer', DefaultLocalization()); 
 *  });
 * ```
 **/
export const DefaultLocalization = (defaultLocale?: string) => {
    const packageDirectory = fileURLToPath(import.meta.url);
    const pathToLocalizer= path.resolve(packageDirectory, "../", "optional", "localizer");
    const { ShrimpleLocalizer } = requir(pathToLocalizer);
    const localizer = new ShrimpleLocalizer as Localization;
    if (defaultLocale) {
        localizer.currentLocale = defaultLocale;
    }
    return localizer; 
}
