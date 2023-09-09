import * as Id from '../../../core/id';
import { CoreModuleStore, ModuleManager } from '../../contracts';
import { Files } from '../../_internal';
import { CommandMeta, CommandModule, CommandModuleDefs, Module } from '../../../types/core-modules';
import { CommandType } from '../enums';
/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using DefaultModuleManager!
 */
export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: CoreModuleStore) {}


    getErrorCallback(m: Module): Record<string, Function> | undefined {
        return this.moduleStore.onError.get(m);
    }
    setErrorCallback(m: Module, c: Record<string, Function>): void {
        this.moduleStore.onError.set(m, c);
    }

    getByNameCommandType<T extends CommandType>(name: string, commandType: T) {
        const id = this.get(Id.create(name, commandType));
        if (!id) {
            return undefined;
        }
        return Files.importModule<CommandModuleDefs[T]>(id);
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
    set(id: string, path: string): void {
        this.moduleStore.commands.set(id, path);
    }
    //not tested
    getPublishableCommands(): Promise<CommandModule[]> {
        const entries = this.moduleStore.commands.entries();
        const publishable = 0b000000110;
        return Promise.all(
            Array.from(entries)
                .filter(([id]) => !(Number.parseInt(id.at(-1)!) & publishable))
                .map(([, path]) => Files.importModule<CommandModule>(path)),
        );
    }
}
