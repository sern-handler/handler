// This file serves an the interface for developers to augment the Dependencies interface
// Developers will have to create a new file dependencies.d.ts in the root directory, augmenting
// this type

/* eslint-disable @typescript-eslint/consistent-type-imports */

import { CoreDependencies } from './ioc';

declare global {
   /**
      * discord.js client. 
      *   '@sern/client':  Client
      * sern emitter listens to events that happen throughout
      * the handler. some include module.register, module.activate.
      *   '@sern/emitter': Contracts.Emitter;
      * An error handler which is the final step before 
      * the sern process actually crashes.
         '@sern/errors':  Contracts.ErrorHandling;
      * Optional logger. Performs ... logging
      *  '@sern/logger'?: Contracts.Logging;
      * Readonly module store. sern stores these 
      * by module.meta.id -> Module
      *  '@sern/modules': Map<string, Module>;
      */
    interface Dependencies extends CoreDependencies {}
}

