import { CommandMeta, Module } from '../../types/core-modules';
import { CoreModuleStore } from '../contracts';

/*
 * @internal
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 * For interacting with modules, use the ModuleManager instead.
 */
export class ModuleStore implements CoreModuleStore {
    onError = new WeakMap<Module, Function>();
    metadata = new WeakMap<Module, CommandMeta>();
    commands = new Map<string, string>();
}
