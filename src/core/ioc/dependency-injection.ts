import type { DependencyConfiguration, MapDeps, IntoDependencies, Dependencies, CoreDependencies } from './types';
import { DefaultLogging } from '../structures';
import { SernError } from '../structures/errors';
import { useContainerRaw } from './base';
import { CoreContainer } from '../structures/container';


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

export function Service<const T extends keyof Dependencies>(key: T) {
    return useContainerRaw().get(key)!;
}

export function Services<const T extends (keyof Dependencies)[]>(...keys: [...T]) {
    const container = useContainerRaw();
    return keys.map(k => container.get(k)!) as IntoDependencies<T>;
}

/**
 * Given the user's conf, check for any excluded dependency keys.
 * Then, call conf.build to get the rest of the users' dependencies.
 * Finally, update the containerSubject with the new container state
 * @param conf
 */
export async function composeRoot(
    container: CoreContainer<Partial<Dependencies>>,
    conf: DependencyConfiguration
) {
    //container should have no client or logger yet.
    const hasLogger = conf.exclude?.has('@sern/logger');
    if (!hasLogger) {
        container.upsert({
            '@sern/logger': () => new DefaultLogging(),
        });
    }
    //Build the container based on the callback provided by the user
    conf.build(container as CoreContainer<CoreDependencies>);
    try {
        container.get('@sern/client');
    } catch {
        throw new Error(SernError.MissingRequired + ' No client was provided');
    }

    if (!hasLogger) {
        container.get('@sern/logger')?.info({ message: 'All dependencies loaded successfully.' });
    }

    container.ready();
}

export function useContainer<const T extends Dependencies>() {
    console.warn(`
        Warning: using a container hook (useContainer) is not recommended.
        Could lead to many unwanted side effects.
        Use the new Service(s) api function instead.
        `
    );
    return <V extends (keyof T)[]>(...keys: [...V]) =>
        keys.map(key => useContainerRaw().get(key as keyof Dependencies)) as MapDeps<T, V>;
}



