import { CommandMeta, Module } from '../../types/core-modules';

/*
 * @deprecated
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 * For interacting with modules, use the ModuleManager instead.
 */
export class ModuleStore {
    metadata = new WeakMap<Module, CommandMeta>();
    commands = new Map<string, Module>();
}
