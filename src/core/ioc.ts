import { Service as $Service, Services as $Services } from '@sern/ioc/global'
import { Container } from '@sern/ioc';
import * as Contracts from './interfaces';
import * as  __Services from './structures/default-services';
import type { Logging } from './interfaces';
import { __init_container, useContainerRaw } from '@sern/ioc/global';
import { EventEmitter } from 'node:events';
import { Client } from 'discord.js';
import { Module } from '../types/core-modules';
import { UnpackFunction } from '../types/utility';

export function disposeAll(logger: Logging|undefined) {
   useContainerRaw() 
        ?.disposeAll()
        .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
}

type Insertable = | ((container: Dependencies) => object)
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
            container.swap(key, v);
        },
   };
};

type ValidDependencyConfig =
    (c: ReturnType<typeof dependencyBuilder>) => any

/**
  * makeDependencies constructs a dependency injection container for sern handler to use.
  * This is required to start the handler, and is to be called before Sern.init.
  * @example
  * ```ts
  * await makeDependencies(({ add }) => {
  *     add('@sern/client', new Client({ intents, partials }) 
  * })
  * ```
  */
export async function makeDependencies (conf: ValidDependencyConfig) {
    const container = await __init_container({ autowire: false });
    //We only include logger if it does not exist 
    const includeLogger = !container.hasKey('@sern/logger');

    if(includeLogger) {
        container.addSingleton('@sern/logger', new __Services.DefaultLogging);
    }
    container.addSingleton('@sern/errors', new __Services.DefaultErrorHandling);
    container.addSingleton('@sern/modules', new Map);
    container.addSingleton('@sern/emitter', new EventEmitter)
    container.addWiredSingleton('@sern/scheduler', 
                         (deps) => new __Services.CronScheduler(deps as unknown as Dependencies))
    conf(dependencyBuilder(container));
    await container.ready();
}


/**
 * The new Service api, a cleaner alternative to useContainer
 * To obtain intellisense, ensure a .d.ts file exists in the root of compilation.
 * Usually our scaffolding tool takes care of this.
 * Note: this method only works AFTER your container has been initiated
 * @since 3.0.0
 * @example
 * ```ts
 * const client = Service('@sern/client');
 * ```
 * @param key a key that corresponds to a dependency registered.
 *
 */
export function Service<const T extends keyof Dependencies>(key: T) {
    return $Service(key) as Dependencies[T]
}
/**
 * @since 3.0.0
 * The plural version of {@link Service}
 * @returns array of dependencies, in the same order of keys provided
 */
export function Services<const T extends (keyof Dependencies)[]>(...keys: [...T]) {
    return $Services<T, IntoDependencies<T>>(...keys)
}

/**
 * @deprecated
 * Creates a singleton object.
 * @param cb
 */
export function single<T>(cb: () => T) { 
    console.log('The `single` function is deprecated and has no effect')
    return cb(); 
}

/**
 * @deprecated
 * @since 2.0.0
 * Creates a transient object
 * @param cb
 */
export function transient<T>(cb: () => () => T) { 
    console.log('The `transient` function is deprecated and has no effect')
    return cb()(); 
}

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];



export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<NonNullable<DependencyFromKey<Tuple[Index]>>>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface CoreDependencies {
    /**
      * discord.js client.
      */
    '@sern/client':  Client;
    /**
      * sern emitter listens to events that happen throughout
      * the handler. some include module.register, module.activate.
      */
    '@sern/emitter': Contracts.Emitter;
    /**
      * An error handler which is the final step before 
      * the sern process actually crashes.
      */
    '@sern/errors':  Contracts.ErrorHandling;
    /**
      * Optional logger. Performs ... logging
      */
    '@sern/logger'?: Contracts.Logging;
    /**
      * Readonly module store. sern stores these 
      * by module.meta.id -> Module
      */
    '@sern/modules': Map<string, Module>;
}

