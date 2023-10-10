import * as assert from 'assert';
import { composeRoot, useContainer } from './dependency-injection';
import type { DependencyConfiguration } from '../../types/ioc';
import { CoreContainer } from './container';

//SIDE EFFECT: GLOBAL DI
let containerSubject: CoreContainer<Partial<Dependencies>>;

/**
 * @deprecated
 * Returns the underlying data structure holding all dependencies.
 * Exposes methods from iti
 * Use the Service API. The container should be readonly
 */
export function useContainerRaw() {
    assert.ok(
        containerSubject && containerSubject.isReady(),
        "Could not find container or container wasn't ready. Did you call makeDependencies?",
    );
    return containerSubject;
}

const dependencyBuilder = (container: any) => {
    const excluded = new Set();
    return {
        add(key: keyof Dependencies, v: Function) {
            container.add(key, v);
        },
        exclude(key: keyof Dependencies) {
           excluded.add(key); 
        },
        update(key: keyof Dependencies, v: Function) {
            container.upsert(key, v);
        },
    };
};


/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export async function makeDependencies<const T extends Dependencies>(
    conf: (builder: ReturnType<typeof dependencyBuilder>) => DependencyConfiguration,
) {
    //Until there are more optional dependencies, just check if the logger exists
    //SIDE EFFECT
    containerSubject = new CoreContainer();
    await composeRoot(containerSubject, conf(dependencyBuilder(containerSubject)));

    return useContainer<T>();
}
