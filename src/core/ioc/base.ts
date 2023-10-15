import * as assert from 'assert';
import { composeRoot, useContainer } from './dependency-injection';
import type { DependencyConfiguration } from '../../types/ioc';
import { CoreContainer } from './container';
import { Result } from 'ts-results-es'
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
    type Insertable = (container: CoreContainer<Dependencies>) => any;
    const excluded = new Set();
    return {
        add(key: keyof Dependencies, v: Insertable) {
            Result
                .wrap(() => container.add(key, v))
                .expect("Failed to add " + key);
        },
        exclude(...keys: (keyof Dependencies)[]) {
            keys.forEach(key => excluded.add(key));
        },
        update(key: keyof Dependencies, v: Insertable) {
            Result
                .wrap(() => container.upsert(key, v))
                .expect("Failed to update " + key);
        },
        /**
          Internal method. do not call this!
         **/
        get __excluded() {
            return excluded
        }
    };
};

type CallbackBuilder = (c: ReturnType<typeof dependencyBuilder>) => any

type ValidDependencyConfig =
    | CallbackBuilder
    | DependencyConfiguration;
    

export async function makeDependencies<const T extends Dependencies>(
    conf: ValidDependencyConfig
) {
    //Until there are more optional dependencies, just check if the logger exists
    //SIDE EFFECT
    containerSubject = new CoreContainer();
    if(typeof conf === 'function') {
        const resultContainer = dependencyBuilder(containerSubject);
        const builtContainer = conf(dependencyBuilder(containerSubject));
        
        // todo
    } else {
        await composeRoot(containerSubject, conf);
    }

    return useContainer<T>();
}
