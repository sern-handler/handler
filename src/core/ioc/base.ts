import * as assert from 'assert';
import { composeRoot, useContainer } from './dependency-injection';
import type { DependencyConfiguration } from '../../types/ioc';
import { CoreContainer } from './container';
import { Result } from 'ts-results-es'
import { DefaultServices } from '../_internal';
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

const dependencyBuilder = (container: any, excluded: string[]) => {
    type Insertable = 
        | ((container: CoreContainer<Dependencies>) => { new(): unknown })
        | { new (): unknown }
    return {
        /**
          * Insert a dependency into your container.
          * Supply the correct key and dependency
          */
        add(key: keyof Dependencies, v: Insertable) {
            Result
                .wrap(() => container.add({ [key]: v}))
                .expect("Failed to add " + key);
        },
        /**
          * Exclude any dependencies from being added.
          * Warning: this could lead to bad errors if not used correctly
          */
        exclude(...keys: (keyof Dependencies)[]) {
            keys.forEach(key => excluded.push(key));
        },
        /**
          * @param key the key of the dependency
          * @param v The dependency to swap out.
          * Swap out a preexisting dependency.
          */
        switch(key: keyof Dependencies, v: Insertable) {
            Result
                .wrap(() => container.upsert({ [key]: v }))
                .expect("Failed to update " + key);
        },
   };
};

type CallbackBuilder = (c: ReturnType<typeof dependencyBuilder>) => any

type ValidDependencyConfig =
    | CallbackBuilder
    | DependencyConfiguration;
    
export const insertLogger = (containerSubject: CoreContainer<any>) => {
    containerSubject
        .upsert({'@sern/logger': () => DefaultServices.DefaultLogging});
}
export async function makeDependencies<const T extends Dependencies>(
    conf: ValidDependencyConfig
) {
    //Until there are more optional dependencies, just check if the logger exists
    //SIDE EFFECT
    containerSubject = new CoreContainer();
    if(typeof conf === 'function') {
        const excluded: string[] = [];
        conf(dependencyBuilder(containerSubject, excluded));
        if(!excluded.includes('@sern/logger')) {
            assert.ok(!containerSubject.getTokens()['@sern/logger'])
            insertLogger(containerSubject);
        }
        containerSubject.ready();
        return useContainer<T>();
        // todo
    } else {
        composeRoot(containerSubject, conf);
    }

    return useContainer<T>();
}



