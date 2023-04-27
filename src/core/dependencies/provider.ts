import type { Container } from 'iti';
import type { AnyDependencies, DependencyConfiguration, MapDeps, ServerlessDependencies, WebsocketDependencies } from '../../types/handler';
import SernEmitter from '../sernEmitter';
import { DefaultErrorHandling, DefaultLogging, DefaultModuleManager } from '../contracts';
import { Result } from 'ts-results-es';
import { BehaviorSubject } from 'rxjs';
import { createContainer } from 'iti';
import { ModuleStore, SernError } from '../structures';
import { AnyWrapper, ServerlessWrapper, WebsocketWrapper } from '../structures/wrapper';

export const containerSubject = new BehaviorSubject(defaultContainer());

/**
 * Given the user's conf, check for any excluded dependency keys.
 * Then, call conf.build to get the rest of the users' dependencies.
 * Finally, update the containerSubject with the new container state
 * @param conf
 */
export function composeRoot<T extends AnyDependencies>(
    conf: DependencyConfiguration<T>
) {
    //Get the current container. This should have no client or possible logger yet.
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
    Result.wrap(() => container.get('@sern/client')).expect(SernError.MissingRequired);

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
        .add({ '@sern/store': () => new ModuleStore() })
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
  * @overload
 */
export function makeFetcher<Dep extends WebsocketDependencies>(containerConfig : WebsocketWrapper['containerConfig'])
    : <const Keys extends (keyof Dep)[]>(ks: [...Keys]) => MapDeps<Dep, [...typeof requiredDependencyKeys, ...Keys]>;
/**
  * @overload
 */
export function makeFetcher<Dep extends ServerlessDependencies>(containerConfig: ServerlessWrapper['containerConfig'])
    : <const Keys extends (keyof Dep)[]>(ks: [...Keys]) => MapDeps<Dep, [...typeof requiredDependencyKeys, ...Keys]>;
/**
 * A way for sern to grab only the necessary dependencies. 
 * Returns a function which allows for the user to call for more dependencies.
 */
export function makeFetcher<Dep extends AnyDependencies>(containerConfig : AnyWrapper['containerConfig']) {
        return <const Keys extends (keyof Dep)[]>(otherKeys: [...Keys]) =>
        containerConfig.get(...requiredDependencyKeys, ...otherKeys as (keyof AnyDependencies)[]) as MapDeps<
            Dep,
            [...typeof requiredDependencyKeys, ...Keys]
        >;
}

