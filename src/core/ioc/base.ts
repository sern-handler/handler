import * as assert from 'assert';
import { useContainer } from './dependency-injection';
import type { CoreDependencies, DependencyConfiguration } from '../../types/ioc';
import { CoreContainer } from './container';
import { Result } from 'ts-results-es';
import { DefaultServices } from '../_internal';
import { AnyFunction } from '../../types/utility';
import type { Logging } from '../contracts/logging';

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

export function disposeAll(logger: Logging|undefined) {
    containerSubject
        ?.disposeAll()
        .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
}

const dependencyBuilder = (container: any, excluded: string[], included: string[]) => {
    type Insertable = 
        | ((container: CoreContainer<Dependencies>) => unknown )
        | object
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
        include(...keys: string[]) {
            included.push(...keys);
        },
        /**
          * @param key the key of the dependency
          * @param v The dependency to swap out.
          * Swap out a preexisting dependency.
          */
        swap(key: keyof Dependencies, v: Insertable) {
            Result
                .wrap(() => container.upsert({ [key]: v }))
                .expect("Failed to update " + key);
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
            Result
                .wrap(() => container.addDisposer({ [key] : cleanup }))
                .expect("Failed to addDisposer for" + key);
        }
   };
};

type CallbackBuilder = (c: ReturnType<typeof dependencyBuilder>) => any

type ValidDependencyConfig =
    | CallbackBuilder
    | DependencyConfiguration;
    
export const insertLogger = (containerSubject: CoreContainer<any>) => {
    containerSubject
        .upsert({'@sern/logger': () => new DefaultServices.DefaultLogging});
}


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
        insertLogger(container);
    }
//    if(conf.include?.includes('@sern/localizer')) {
//        insertLocalizer(container);
//    }
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
        const included: string[] = [];
        conf(dependencyBuilder(containerSubject, excluded, included));
        
        const includeLogger = 
            !excluded.includes('@sern/logger') 
            && !containerSubject.getTokens()['@sern/logger'];

        if(includeLogger) {
            insertLogger(containerSubject);
        }

        containerSubject.ready();
    } else {
        composeRoot(containerSubject, conf);
    }

    return useContainer<T>();
}

