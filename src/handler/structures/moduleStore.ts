import type { CommandModule } from '../../types/module';
import { ApplicationCommandType, ComponentType, InteractionType } from 'discord.js';
import type { EventEmitter } from 'events';

// https://softwareengineering.stackexchange.com/questions/143736/why-do-we-need-private-variables
//  Excuse the boilerplate for better organization of code
//
export class ModuleStore {
     readonly BothCommands = Object.freeze(new Map<string, CommandModule>());
     readonly ApplicationCommands = {
        [ApplicationCommandType.User]: Object.freeze(new Map<string, CommandModule>()),
        [ApplicationCommandType.Message]: Object.freeze(new Map<string, CommandModule>()),
        [ApplicationCommandType.ChatInput]: Object.freeze(new Map<string, CommandModule>()),
    };

     readonly InteractionHandlers = {
        [ComponentType.Button]: Object.freeze(new Map<string, CommandModule>()),
        [ComponentType.SelectMenu]: Object.freeze(new Map<string, CommandModule>()),
        [InteractionType.ModalSubmit] : Object.freeze(new Map<string, CommandModule>())
    };
     readonly TextCommands = {
        text: Object.freeze(new Map<string, CommandModule>()),
        aliases: Object.freeze(new Map<string, CommandModule>()),
    };
    /**
     * keeps all external emitters stored here
     */
     readonly ExternalEventEmitters = Object.freeze(new Map<string, EventEmitter>());

}
