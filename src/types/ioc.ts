import type { Container } from '@sern/ioc';
import * as Contracts from '../core/interfaces';
import type { UnpackFunction  } from './utility'
import type { Client } from 'discord.js'
import { Module } from './core-modules';


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

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<NonNullable<DependencyFromKey<Tuple[Index]>>>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

/**
  * @deprecated This old signature will be incompatible with future versions of sern.
  * ```ts
  *  To switch your old code:
     await makeDependencies(({ add }) => { 
            add('@sern/client', new Client())
     })
  *  ```
  */
export interface DependencyConfiguration {
    build: (root: Container) => Container;
}
