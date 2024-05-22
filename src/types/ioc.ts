import type { Container } from '../core/ioc/container';
import * as Contracts from '../core/interfaces';
import type { UnpackFunction  } from './utility'
import type { Client } from 'discord.js'
import { Module } from './core-modules';


export interface CoreDependencies {
    '@sern/client':  Client;
    '@sern/emitter': Contracts.Emitter;
    '@sern/errors':  Contracts.ErrorHandling;
    '@sern/logger'?: Contracts.Logging;
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
