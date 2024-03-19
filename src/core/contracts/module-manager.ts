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

/**
 * @since 2.0.0
 * @internal - direct access to the module manager will be removed in version 4
 */
export interface ModuleManager extends MetadataAccess {
    get(id: string): Module | undefined;

    set(id: string, path: Module): void;
    /**
     * @deprecated
     */
    getPublishableCommands(): CommandModule[];

    /*
     * @deprecated
     */
    getByNameCommandType<T extends CommandType>(
        name: string,
        commandType: T,
    ): CommandModuleDefs[T] | undefined;
}
