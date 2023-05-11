import * as assert from 'assert';
import { composeRoot, useContainer } from './dependency-injection';
import { Dependencies, DependencyConfiguration } from './types';
import { CoreContainer } from '../structures/container';


//SIDE EFFECT: GLOBAL DI 
let containerSubject: CoreContainer<Partial<Dependencies>>;

/**
 * Returns the underlying data structure holding all dependencies.
 * Exposes methods from iti
 */
export function useContainerRaw() {
    assert.ok(
        containerSubject && containerSubject.isReady(),
        "Could not find container or container wasn't ready. Did you call makeDependencies?"
    );
    return containerSubject;
}

/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export async function makeDependencies<const T extends Dependencies>(
    conf: DependencyConfiguration,
) {
    //Until there are more optional dependencies, just check if the logger exists
    //SIDE EFFECT
    containerSubject = new CoreContainer();
    await composeRoot(containerSubject, conf);

    return useContainer<T>();
}

