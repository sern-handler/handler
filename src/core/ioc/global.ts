import { Container } from './container';

//SIDE EFFECT: GLOBAL DI
let containerSubject: Container;

/**
  * Don't use this unless you know what you're doing. Destroys old containerSubject if it exists and disposes everything
  * then it will swap
  */
export async function __swap_container(c: Container) {
    if(containerSubject) {
       await containerSubject.disposeAll() 
    }
    containerSubject = c;
}

/**
  * Don't use this unless you know what you're doing. Destroys old containerSubject if it exists and disposes everything
  * then it will swap
  */
export function __add_container(key: string, v: object) {
    containerSubject.addSingleton(key, v);
}

/**
  * Initiates the global api.
  * Once this is finished, the Service api and the other global api is available
  */
export function __init_container(options: {
    autowire: boolean;
    path?: string | undefined;
}) {
    containerSubject = new Container(options);
}

/**
 * Returns the underlying data structure holding all dependencies.
 * Exposes methods from iti
 * Use the Service API. The container should be readonly
 */
export function useContainerRaw() {
    if (!(containerSubject && containerSubject.isReady())) {
        throw new Error("Container wasn't ready or init'd. Please ensure container is ready()");
    }

    return containerSubject;
}

/**
 * The Service api, retrieve from the globally init'ed container
 * Note: this method only works AFTER your container has been initiated
 * @since 3.0.0
 * @example
 * ```ts
 * const client = Service('@sern/client');
 * ```
 * @param key a key that corresponds to a dependency registered.
 *
 */
export function Service<const T>(key: PropertyKey) {
    const dep = useContainerRaw().get<T>(key)!;
    if(!dep) {
        throw Error("Requested key " + String(key) + " returned undefined");
    }
    return dep;
}
/**
 * @since 3.0.0
 * The plural version of {@link Service}
 * @returns array of dependencies, in the same order of keys provided
 */
export function Services<const T extends string[], V>(...keys: [...T]) {
    const container = useContainerRaw();
    return keys.map(k => container.get(k)!) as V;
}
