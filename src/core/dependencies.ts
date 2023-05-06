import type { Container } from 'iti';
import type { AnyDependencies, DependencyConfiguration, MapDeps, Wrapper } from '../types/core';
import { DefaultErrorHandling, DefaultLogging, DefaultModuleManager } from './contracts';
import { Result } from 'ts-results-es';
import { BehaviorSubject } from 'rxjs';
import { createContainer } from 'iti';
import { SernEmitter } from './structures';

export const containerSubject = new BehaviorSubject(defaultContainer());

/**
 * @__PURE__
 * @since 2.0.0.
 * Please note that on intellij, the deprecation is for all signatures, which is unintended behavior (and
 * very annoying).
 * For future versions, ensure that single is being passed as a **callback!!**
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
export function transient<T>(cb: (() => () => T) ) {
    return cb;
}
/**
 * Given the user's conf, check for any excluded dependency keys.
 * Then, call conf.build to get the rest of the users' dependencies.
 * Finally, update the containerSubject with the new container state
 * @param conf
 */
export function composeRoot<T extends AnyDependencies>(
    conf: DependencyConfiguration<T>
) {
    //This should have no client or logger yet.
    const currentContainer = containerSubject.getValue();
    const excludeLogger = conf.exclude?.has('@sern/logger');
    if (!excludeLogger) {
        currentContainer.add({
            '@sern/logger': () => new DefaultLogging(),
        });
    }
    //Build the container based on the callback provided by the user
    const container = conf.build(currentContainer);
    //Check if the built container contains @sern/client or throw
    // a runtime exception
    //Result.wrap(() => container.get('@sern/client')).expect(SernError.MissingRequired);

    if (!excludeLogger) {
        container.get('@sern/logger')?.info({ message: 'All dependencies loaded successfully.' });
    }
    containerSubject.next(container as any);
}

export function useContainer<const T extends AnyDependencies>() {
    const container = containerSubject.getValue() as Container<T, {}>;
    return <V extends (keyof T)[]>(...keys: [...V]) =>
        keys.map(key => Result.wrap(() => container.get(key)).unwrapOr(undefined)) as MapDeps<T, V>;
}

/**
 * Returns the underlying data structure holding all dependencies.
 * Please be careful as this only gets the client's current state.
 * Exposes some methods from iti
 */
export function useContainerRaw<T extends AnyDependencies>() {
    return containerSubject.getValue() as Container<T, {}>;
}

/**
 * Provides all the defaults for sern to function properly.
 * The only user provided dependency needs to be @sern/client
 */
function defaultContainer() {
    return createContainer()
        .add({ '@sern/errors': () => new DefaultErrorHandling() })
        .add({ '@sern/store': () => new Map() })
        .add(ctx => {
            return {
                '@sern/modules': () => new DefaultModuleManager(ctx['@sern/store']),
            };
        })
        .add({ '@sern/emitter': () => new SernEmitter() }) as Container<
        Omit<AnyDependencies, '@sern/client' | '@sern/logger'>,
        {}
    >;
}

const requiredDependencyKeys = [
    '@sern/emitter',
    '@sern/errors',
    '@sern/logger',
] as const;

/**
 * A way for sern to grab only the necessary dependencies. 
 * Returns a function which allows for the user to call for more dependencies.
 */
export function makeFetcher<Dep extends AnyDependencies>(containerConfig : Wrapper['containerConfig']) {
        return <const Keys extends (keyof Dep)[]>(otherKeys: [...Keys]) =>
        containerConfig.get(...requiredDependencyKeys, ...otherKeys as (keyof AnyDependencies)[]) as MapDeps<
            Dep,
            [...typeof requiredDependencyKeys, ...Keys]
        >;
}

/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<const T extends AnyDependencies>(conf: DependencyConfiguration<T>) {
    //Until there are more optional dependencies, just check if the logger exists
    composeRoot(conf);
    return useContainer<T>();
}
