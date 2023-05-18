import { CommandMeta, CommandModule, Module } from '../types/modules';

/**
 * @since 2.0.0
 */
export interface ModuleManager {
    get(id: string): string | undefined;
    getMetadata(m: Module): CommandMeta;
    setMetadata(m: Module, c: CommandMeta): void;
    set(id: string, path: string): void;
    getPublishableCommands(): Promise<CommandModule[]>;
    remove(id: string): boolean;
}
