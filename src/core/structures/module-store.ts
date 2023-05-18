import { CoreModuleStore } from '../contracts';
import { Module, CommandMeta } from '../types/modules';

/*
 * @internal
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 * For interacting with modules, use the ModuleManager instead.
 */
export class ModuleStore implements CoreModuleStore {
    metadata = new WeakMap<Module, CommandMeta>();
    commands = new Map<string, string>();
}
