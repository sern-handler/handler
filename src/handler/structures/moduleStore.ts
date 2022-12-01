import type { CommandModule } from '../../types/module';
import { ApplicationCommandType, ComponentType, InteractionType } from 'discord.js';

/**
 * Storing all command modules
 * This dependency is usually injected into ModuleManager
 */
export class ModuleStore {
     readonly BothCommands = new Map<string, CommandModule>();
     readonly ApplicationCommands = {
        [ApplicationCommandType.User]: new Map<string, CommandModule>(),
        [ApplicationCommandType.Message]: new Map<string, CommandModule>(),
        [ApplicationCommandType.ChatInput]: new Map<string, CommandModule>(),
    };

     readonly InteractionHandlers = {
        [ComponentType.Button]: new Map<string, CommandModule>(),
        [ComponentType.SelectMenu]: new Map<string, CommandModule>(),
        [InteractionType.ModalSubmit] : new Map<string, CommandModule>()
    };
     readonly TextCommands = {
        text: new Map<string, CommandModule>(),
        aliases: new Map<string, CommandModule>(),
    };
}

