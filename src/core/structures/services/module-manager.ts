import * as Id from '../../../core/id';
import { CoreModuleStore, ModuleManager } from '../../contracts';
import { CommandMeta, CommandModule, CommandModuleDefs, Module } from '../../../types/core-modules';
import { CommandType } from '../enums';
/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using DefaultModuleManager!
 */
export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: CoreModuleStore) {}


    getByNameCommandType<T extends CommandType>(name: string, commandType: T) {
        const module = this.get(Id.create(name, commandType));
        if (!module) {
            return undefined;
        }
        return module as CommandModuleDefs[T];
    }

    setMetadata(m: Module, c: CommandMeta): void {
        this.moduleStore.metadata.set(m, c);
    }

    getMetadata(m: Module): CommandMeta {
        const maybeModule = this.moduleStore.metadata.get(m);
        if (!maybeModule) {
            throw Error('Could not find metadata in store for ' + m);
        }
        return maybeModule;
    }

    get(id: string) {
        return this.moduleStore.commands.get(id);
    }
    set(id: string, path: CommandModule): void {
        this.moduleStore.commands.set(id, path);
    }
    //not tested
    getPublishableCommands(): CommandModule[] {
        const entries = this.moduleStore.commands.entries();
        const publishable = 0b000000110;
        return Array.from(entries)
                .filter(([id]) => {
                    const last_entry = id.at(-1);
                    return last_entry == 'B' ||  !(publishable & Number.parseInt(last_entry!));
                })
                .map(([, path]) => path as CommandModule);
    }
}
