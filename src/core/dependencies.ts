import { Container } from 'iti';
import type { Dependencies, DependencyConfiguration, MapDeps, Wrapper } from '../types/core';
import { DefaultErrorHandling, DefaultLogging, DefaultModuleManager } from './contracts';
import { Result } from 'ts-results-es';
import { createContainer } from 'iti';
import { SernEmitter } from './structures';
import { SernError } from './structures/errors';
export let containerSubject: Container<{}, {}> 
const requiredDependencyKeys = ['@sern/emitter', '@sern/errors', '@sern/logger'] as const;
/**
 * @__PURE__
 * @since 2.0.0.
 * use single if you want a singleton, or an object that is called once.
 * @param cb
 */
export function single<T>(cb: () => T) {
    return cb;
}

/**
 * @__PURE__
 * @since 2.0.0
 * Following iti's singleton and transient implementation,
 * use transient if you want a new dependency every time your container getter is called
 * @param cb
 */
export function transient<T>(cb: () => () => T) {
    return cb;
}
/**
 * Given the user's conf, check for any excluded dependency keys.
 * Then, call conf.build to get the rest of the users' dependencies.
 * Finally, update the containerSubject with the new container state
 * @param conf
 */
export function composeRoot<T extends Dependencies>(conf: DependencyConfiguration<T>) {
    //This should have no client or logger yet.
    const excludeLogger = conf.exclude?.has('@sern/logger');
    if (!excludeLogger) {
        containerSubject.add({
            '@sern/logger': () => new DefaultLogging(),
        });
    }
    //Build the container based on the callback provided by the user
    const container = conf.build(containerSubject as Container<Omit<Dependencies, '@sern/client'>, {}>);
    try {
        container.get('@sern/client');
    } catch {
        throw new Error(SernError.MissingRequired + " No client was provided")
    }

    if (!excludeLogger) {
        container.get('@sern/logger')?.info({ message: 'All dependencies loaded successfully.' });
    }
}

export function useContainer<const T extends Dependencies>() {
    const container = containerSubject as Container<T, {}>;
    return <V extends (keyof T)[]>(...keys: [...V]) =>
        keys.map(key => Result.wrap(() => container.get(key)).expect(`Unregistered dependency: ${String(key)}`)) as MapDeps<T, V>;
}

/**
 * Returns the underlying data structure holding all dependencies.
 * Please be careful as this only gets the client's current state.
 * Exposes some methods from iti
 */
export function useContainerRaw<T extends Dependencies>() {
    if(!containerSubject) {
        throw Error("Could not find container. Did you call makeDependencies?")
    }
    return containerSubject as Container<T, {}>;
}

/**
 * Provides all the defaults for sern to function properly.
 * The only user provided dependency needs to be @sern/client
 */
function defaultContainer() {
    return createContainer()
        .add({
            '@sern/errors': () => new DefaultErrorHandling(),
            '@sern/store': () => new Map<string, string>(),
            '@sern/emitter': () => new SernEmitter()
        })
        .add(ctx => {
            return {
                '@sern/modules': () => new DefaultModuleManager(ctx['@sern/store']),
            };
        })
}


/**
 * A way for sern to grab only the necessary dependencies.
 * Returns a function which allows for the user to call for more dependencies.
 */
export function makeFetcher<Dep extends Dependencies>(
    containerConfig: Wrapper['containerConfig'],
) {
    return <const Keys extends (keyof Dep)[]>(otherKeys: [...Keys]) =>
        containerConfig.get(
            ...requiredDependencyKeys,
            ...(otherKeys as (keyof Dependencies)[]),
        ) as MapDeps<Dep, [...typeof requiredDependencyKeys, ...Keys]>;
}

/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<const T extends Dependencies>(
    conf: DependencyConfiguration<T>,
) {
    containerSubject = defaultContainer()
    //Until there are more optional dependencies, just check if the logger exists
    composeRoot(conf);
    return useContainer<T>();
}
