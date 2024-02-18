import * as assert from 'assert';
import { useContainer } from './dependency-injection';
import type { CoreDependencies, DependencyConfiguration } from '../../types/ioc';
import { CoreContainer } from './container';
import { Result } from 'ts-results-es';
import { __Services } from '../_internal';
import { AnyFunction } from '../../types/utility';
import type { Logging } from '../contracts/logging';
import type { UnpackFunction } from 'iti';
//SIDE EFFECT: GLOBAL DI
let containerSubject: CoreContainer<Partial<Dependencies>>;

/**
  * @internal
  * Don't use this unless you know what you're doing. Destroys old containerSubject if it exists and disposes everything
  * then it will swap
  */
export async function __swap_container(c: CoreContainer<Partial<Dependencies>>) {
    if(containerSubject) {
       await containerSubject.disposeAll() 
    }
    containerSubject = c;
}

/**
  * @internal
  * Don't use this unless you know what you're doing. Destroys old containerSubject if it exists and disposes everything
  * then it will swap
  */
export function __add_container(key: string,v : Insertable) {
    containerSubject.add({ [key]: v });
}

/**
 * Returns the underlying data structure holding all dependencies.
 * Exposes methods from iti
 * Use the Service API. The container should be readonly from the consumer side
 */
export function useContainerRaw() {
    assert.ok(
        containerSubject && containerSubject.isReady(),
        "Could not find container or container wasn't ready. Did you call makeDependencies?",
    );
    return containerSubject;
}

export function disposeAll(logger: Logging|undefined) {
    containerSubject
        ?.disposeAll()
        .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
}
type UnpackedDependencies = {
    [K in keyof Dependencies]: UnpackFunction<Dependencies[K]>
}
type Insertable = 
        | ((container: UnpackedDependencies) => unknown)
        | object
const dependencyBuilder = (container: any, excluded: string[] ) => {
    return {
        /**
          * Insert a dependency into your container.
          * Supply the correct key and dependency
          */
        add(key: keyof Dependencies, v: Insertable) {
            if(typeof v !== 'function') {
                Result.wrap(() => container.add({ [key]: v}))
                      .expect("Failed to add " + key);
            } else {
                Result.wrap(() => 
                       container.add((cntr: UnpackedDependencies) => ({ [key]: v(cntr)} )))
                      .expect("Failed to add " + key);
            }
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
        swap(key: keyof Dependencies, v: Insertable) {
            if(typeof v !== 'function') {
                Result.wrap(() => container.upsert({ [key]: v}))
                      .expect("Failed to update " + key);
            } else {
                Result.wrap(() => 
                       container.upsert((cntr: UnpackedDependencies) => ({ [key]: v(cntr)})))
                      .expect("Failed to update " + key);
            }
        },
        /**
          * @param key the key of the dependency
          * @param cleanup Provide cleanup for the dependency at key. First parameter is the dependency itself 
          * @example
          * ```ts 
          * addDisposer('dbConnection', (dbConnection) => dbConnection.end())
          * ```
          * Swap out a preexisting dependency.
          */
        addDisposer(key: keyof Dependencies, cleanup: AnyFunction) {
            Result.wrap(() => container.addDisposer({ [key] : cleanup }))
                  .expect("Failed to addDisposer for" + key);
        }
   };
};


type ValidDependencyConfig =
    | ((c: ReturnType<typeof dependencyBuilder>) => any)
    | DependencyConfiguration;
    

/**
 * Given the user's conf, check for any excluded/included dependency keys.
 * Then, call conf.build to get the rest of the users' dependencies.
 * Finally, update the containerSubject with the new container state
 * @param conf
 */
function composeRoot(
    container: CoreContainer<Partial<Dependencies>>,
    conf: DependencyConfiguration,
) {
    //container should have no client or logger yet.
    const hasLogger = conf.exclude?.has('@sern/logger');
    if (!hasLogger) {
        __add_container('@sern/logger', new __Services.DefaultLogging);
    }
    //Build the container based on the callback provided by the user
    conf.build(container as CoreContainer<Omit<CoreDependencies, '@sern/client'>>);
    
    if (!hasLogger) {
        container.get('@sern/logger')?.info({ message: 'All dependencies loaded successfully.' });
    }

    container.ready();
}

export async function makeDependencies<const T extends Dependencies>
(conf: ValidDependencyConfig) {
    containerSubject = new CoreContainer();
    if(typeof conf === 'function') {
        const excluded: string[] = [];
        conf(dependencyBuilder(containerSubject, excluded));
        //We only include logger if it does not exist 
        const includeLogger = 
            !excluded.includes('@sern/logger') 
            && !containerSubject.hasKey('@sern/logger');

        if(includeLogger) {
            __add_container('@sern/logger', new __Services.DefaultLogging);
        }

        containerSubject.ready();
    } else {
        composeRoot(containerSubject, conf);
    }

    return useContainer<T>();
}

