import type { DependencyConfiguration } from '../../types/ioc';
import { Container } from './container';
import { Result } from 'ts-results-es';
import * as  __Services from '../structures/default-services';
import { AnyFunction, UnpackFunction } from '../../types/utility';
import type { Logging } from '../interfaces';
import { __add_container, __swap_container, useContainerRaw } from './global';

export function disposeAll(logger: Logging|undefined) {
   useContainerRaw() 
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
async function composeRoot(
    container: Container,
    conf: DependencyConfiguration,
) {
    //container should have no client or logger yet.
    const hasLogger = conf.exclude?.has('@sern/logger');
    if (!hasLogger) {
        __add_container('@sern/logger', new __Services.DefaultLogging);
    }
    //Build the container based on the callback provided by the user
    conf.build(container as Container);
    
    if (!hasLogger) {
        container
            .get<Logging>('@sern/logger')
            ?.info({ message: 'All dependencies loaded successfully.' });
    }
    container.ready();
}

export async function makeDependencies (conf: ValidDependencyConfig) {
    __swap_container(new Container({ autowire: false }));
    if(typeof conf === 'function') {
        const excluded: string[] = [];
        conf(dependencyBuilder(useContainerRaw(), excluded));
        //We only include logger if it does not exist 
        const includeLogger = 
            !excluded.includes('@sern/logger') 
            && !useContainerRaw().hasKey('@sern/logger');

        if(includeLogger) {
            __add_container('@sern/logger', new __Services.DefaultLogging);
        }
        await useContainerRaw().ready();
    } else {
        await composeRoot(useContainerRaw(), conf);
    }
}

