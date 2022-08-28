import type { CommandModule } from '../../types/module';
import { ApplicationCommandOptionType, ApplicationCommandType, ComponentType, InteractionType } from 'discord.js';
import type { EventEmitter } from 'events';
import { CommandType } from './enums.js';
import { match } from 'ts-pattern';
import constFn from '../utilities/constantFunction.js';

/**
 * Would be a little overkill for a class just for the event emitters?
 */
export const ExternalEventEmitters = new Map<string, EventEmitter>();
/**
 * Storing all command modules
 */
export class ModuleStore {
     protected readonly BothCommands = new Map<string, CommandModule>();
     protected readonly ApplicationCommands = {
        [ApplicationCommandType.User]: new Map<string, CommandModule>(),
        [ApplicationCommandType.Message]: new Map<string, CommandModule>(),
        [ApplicationCommandType.ChatInput]: new Map<string, CommandModule>(),
    };

     protected readonly InteractionHandlers = {
        [ComponentType.Button]: new Map<string, CommandModule>(),
        [ComponentType.SelectMenu]: new Map<string, CommandModule>(),
        [InteractionType.ModalSubmit] : new Map<string, CommandModule>()
    };
     protected readonly TextCommands = {
        text: new Map<string, CommandModule>(),
        aliases: new Map<string, CommandModule>(),
    };

    /**
     *
     * @param appType
     * Resolves the current map with an ApplicationCommandType
     */
     resolveApplicationCommandMap(appType: ApplicationCommandType) {
         return this.ApplicationCommands[appType];
     }

    /**
    *
    * @param mapping
    * Resolves the handler by given component type, or if the type of interaction is a modal submit
    */
    resolveInteractionHandlersMap(mapping: ComponentType.Button | ComponentType.SelectMenu | InteractionType.ModalSubmit) {
        return this.InteractionHandlers[mapping];
    }

    /**
     *
     * @param type
     * Resolves the map with a CommandType
     */
     resolveMap<T extends CommandType>(type: T)  {
        return match(type as CommandType)
            .with(CommandType.Text, constFn(this.TextCommands.text))
            .with(CommandType.Modal, constFn(this.InteractionHandlers[InteractionType.ModalSubmit]))
            .with(CommandType.Button, constFn(this.InteractionHandlers[ComponentType.Button]))
            .with(CommandType.MenuSelect, constFn(this.InteractionHandlers[ComponentType.SelectMenu]))
            .with(CommandType.Both, constFn(this.BothCommands))
            .with(CommandType.MenuMsg, constFn(this.ApplicationCommands[ApplicationCommandType.Message]))
            .with(CommandType.MenuUser, constFn(this.ApplicationCommands[ApplicationCommandType.User]))
            .with(CommandType.Slash, constFn(this.ApplicationCommands[ApplicationCommandType.ChatInput]))
            .otherwise(() => {
                throw Error('Cannot find a map under this type');
            });

     }
}

