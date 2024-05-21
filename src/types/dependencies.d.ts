// This file serves an the interface for developers to augment the Dependencies interface
// Developers will have to create a new file dependencies.d.ts in the root directory, augmenting
// this type

/* eslint-disable @typescript-eslint/consistent-type-imports */

import { CoreDependencies } from './ioc';

declare global {
    interface Dependencies extends CoreDependencies {}
}

