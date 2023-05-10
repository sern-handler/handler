import { CommandModule } from "../types/modules";

/**
 * @since 2.0.0
 */
export interface ModuleManager {
    get(id: string): string | undefined;
    set(id: string, path: string): void;
    getPublishableCommands(): Promise<CommandModule[]>;
    remove(id: string) : boolean
}

