import type {
    CommandMeta,
    CommandModule,
    CommandModuleDefs,
    Module,
} from '../../types/core-modules';
import { CommandType } from '../structures';

interface MetadataAccess {
    getMetadata(m: Module): CommandMeta | undefined;
    setMetadata(m: Module, c: CommandMeta): void;
}

interface OnErrorAccess {
    getErrorCallback(m: Module): Function|undefined;
    setErrorCallback(m: Module, c: Function): void;
}
/**
 * @since 2.0.0
 * @deprecated - direct access to the module manager will be removed in version 4
 */
export interface ModuleManager extends MetadataAccess, OnErrorAccess {
    get(id: string): string | undefined;

    set(id: string, path: string): void;
    getPublishableCommands(): Promise<CommandModule[]>;
    getByNameCommandType<T extends CommandType>(
        name: string,
        commandType: T,
    ): Promise<CommandModuleDefs[T]> | undefined;
}
