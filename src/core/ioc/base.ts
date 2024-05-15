import type { DependencyConfiguration } from '../../types/ioc';
import { Container } from './container';
import * as  __Services from '../structures/default-services';
import { UnpackedDependencies } from '../../types/utility';
import type { Logging } from '../interfaces';
import { __add_container, __init_container, __swap_container, useContainerRaw } from './global';

export function disposeAll(logger: Logging|undefined) {
   useContainerRaw() 
        ?.disposeAll()
        .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
}


type Insertable = 
        | ((container: UnpackedDependencies) => unknown)
        | object
const dependencyBuilder = (container: Container, excluded: string[] ) => {
    return {
        /**
          * Insert a dependency into your container.
          * Supply the correct key and dependency
          */
        add(key: keyof Dependencies, v: Insertable) {
            if(typeof v !== 'function') {
                container.addSingleton(key, v)
            } else {
                //TODO fixme
                //@ts-ignore
                container.addWiredSingleton(key, (cntr: UnpackedDependencies) => v(cntr))
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
            //todo in container
            this.add(key, v);
        },
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
        __add_container('@sern/logger', new __Services.DefaultLogging());
    }
    __add_container('@sern/errors', new __Services.DefaultErrorHandling());
    __add_container('@sern/cron', {})
    __add_container('@sern/modules', new Map())
    //Build the container based on the callback provided by the user
    conf.build(container as Container);
    
    if (!hasLogger) {
        container.get<Logging>('@sern/logger')
                 ?.info({ message: 'All dependencies loaded successfully.' });
    }
    container.ready();
}

export async function makeDependencies (conf: ValidDependencyConfig) {
    await __init_container({ autowire: false });
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
        __add_container('@sern/errors', new __Services.DefaultErrorHandling());
        __add_container('@sern/cron', {})
        await useContainerRaw().ready();
    } else {
        await composeRoot(useContainerRaw(), conf);
    }
}

