import type { CommandModule } from '../../types/module';
import { ApplicationCommandType, ComponentType } from 'discord.js';

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
    readonly ModalSubmit = new Map<string, CommandModule>();
    readonly TextCommands = new Map<string, CommandModule>();
    readonly InteractionHandlers = {
        [ComponentType.Button]: new Map<string, CommandModule>(),
        [ComponentType.StringSelect]: new Map<string, CommandModule>(),
        [ComponentType.ChannelSelect]: new Map<string, CommandModule>(),
        [ComponentType.MentionableSelect]: new Map<string, CommandModule>(),
        [ComponentType.RoleSelect]: new Map<string, CommandModule>(),
        [ComponentType.UserSelect]: new Map<string, CommandModule>(),
    };
}
