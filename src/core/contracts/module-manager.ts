import { CommandMeta, CommandModule, CommandModuleDefs, Module } from '../../types/core-modules';
import { CommandType } from '../structures';

/**
 * @since 2.0.0
 */
export interface ModuleManager {
    get(id: string): string | undefined;
    getMetadata(m: Module): CommandMeta|undefined;
    setMetadata(m: Module, c: CommandMeta): void;
    set(id: string, path: string): void;
    getPublishableCommands(): Promise<CommandModule[]>;
    getByNameCommandType<T extends CommandType>(name: string, commandType: T): Promise<CommandModuleDefs[T]>|undefined;
}
