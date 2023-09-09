import type { CommandMeta, Module } from '../../types/core-modules';

/**
 * Represents a core module store that stores IDs mapped to file paths.
 */
export interface CoreModuleStore {
    commands: Map<string, string>;
    metadata: WeakMap<Module, CommandMeta>;
    onError: WeakMap<Module, Function>;
}
