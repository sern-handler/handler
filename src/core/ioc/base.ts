import { Container } from './container';
import * as  __Services from '../structures/default-services';
import type { Logging } from '../interfaces';
import { __add_container, __add_wiredcontainer, __init_container, __swap_container, useContainerRaw } from './global';
import { EventEmitter } from 'node:events';

export function disposeAll(logger: Logging|undefined) {
   useContainerRaw() 
        ?.disposeAll()
        .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
}

type Insertable = 
        | ((container: Dependencies) => object)
        | object

const dependencyBuilder = (container: Container) => {
    return {
        /**
          * Insert a dependency into your container.
          * Supply the correct key and dependency
          */
        add(key: keyof Dependencies, v: Insertable) {
            if(typeof v !== 'function') {
                container.addSingleton(key, v)
            } else {
                //@ts-ignore
                container.addWiredSingleton(key, (cntr) => v(cntr))
            }
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

/**
  * 
  *
  *
  */
type ValidDependencyConfig =
    | ((c: ReturnType<typeof dependencyBuilder>) => any)


export async function makeDependencies (conf: ValidDependencyConfig) {
    const container = await __init_container({ autowire: false });
    //We only include logger if it does not exist 
    const includeLogger = !container.hasKey('@sern/logger');

    if(includeLogger) {
        __add_container('@sern/logger', new __Services.DefaultLogging);
    }
    __add_container('@sern/errors', new __Services.DefaultErrorHandling);
    __add_container('@sern/modules', new Map)
    __add_container('@sern/emitter', new EventEmitter)
    __add_wiredcontainer('@sern/cron', deps => new __Services.Cron(deps))
    conf(dependencyBuilder(container));
    await container.ready();
}

