import { CoreModuleStore } from '../contracts';

/*
 * @internal
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 * For interacting with ModuleStore, use CoreModuleStore contract.
 */
export class ModuleStore implements CoreModuleStore {
    commands = new Map<string, string>();
}
