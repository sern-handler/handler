import { ApplicationCommandType, ComponentType } from 'discord.js';
import type {
    BothCommand,
    CommandModule,
    ContextMenuMsg,
    ContextMenuUser,
    ModalSubmitCommand,
    SlashCommand,
} from './module.js';
import type { EventEmitter } from 'node:events';
import type { DefinitelyDefined } from '../../types/handler';

class ModuleManager {
    private BothCommands = new Map<string, CommandModule>();
    private ApplicationCommands = {
        [ApplicationCommandType.User]: new Map<string, CommandModule>(),
        [ApplicationCommandType.Message]: new Map<string, CommandModule>(),
        [ApplicationCommandType.ChatInput]: new Map<string, CommandModule>(),
    } as { [K in ApplicationCommandType]: Map<string, CommandModule> };

    private MessageCompCommands = {
        [ComponentType.Button]: new Map<string, CommandModule>(),
        [ComponentType.SelectMenu]: new Map<string, CommandModule>(),
        [ComponentType.TextInput]: new Map<string, CommandModule>(),
    };
    private TextCommands = {
        text: new Map<string, CommandModule>(),
        aliases: new Map<string, CommandModule>(),
    };
    private ModalSubmitCommands = new Map<string, CommandModule>();
    /**
     * keeps all external emitters stored here
     */
    private ExternalEventEmitters = new Map<string, EventEmitter>();

    private static getFromMap<T>(map: Map<string, T>, name: string): Readonly<T> | undefined {
        return Object.freeze(map.get(name));
    }
    private static setIntoMap<T>(map: Map<string, T>, key: string, value: T) {
        map.set(key, value);
    }

    public setIntoApplicationStore(
        type: ApplicationCommandType,
        value: DefinitelyDefined<CommandModule, 'name'>,
    ) {
        ModuleManager.setIntoMap(this.ApplicationCommands[type], value.name, value);
    }

    public setIntoComponentStore(
        type: Exclude<ComponentType, ComponentType.ActionRow>,
        value: DefinitelyDefined<CommandModule, 'name'>,
    ) {
        ModuleManager.setIntoMap(this.MessageCompCommands[type], value.name, value);
    }

    public getFromApplicationType(type: ApplicationCommandType, name: string) {
        return ModuleManager.getFromMap(this.ApplicationCommands[type], name);
    }

    public getFromComponentsStore(
        type: Exclude<ComponentType, ComponentType.ActionRow>,
        name: string,
    ) {
        return ModuleManager.getFromMap(this.MessageCompCommands[type], name);
    }

    setIntoBoth(mod: DefinitelyDefined<BothCommand, 'name'>) {
         ModuleManager.setIntoMap(this.BothCommands,mod.name, mod);
    }

    setIntoSlash(mod: DefinitelyDefined<SlashCommand, 'name'>) {
         this.setIntoApplicationStore(ApplicationCommandType.ChatInput, mod);
    }
    /**
     *  Checks both aliases and text command map
     */
    setIntoText(mod: DefinitelyDefined<SlashCommand, 'name'>) {
        ModuleManager.setIntoMap(this.TextCommands.text,mod.name, mod);
    }
    setIntoMessageContextMenu(mod: DefinitelyDefined<ContextMenuMsg, 'name'>) {
        return this.setIntoApplicationStore(ApplicationCommandType.Message, mod);
    }

    setIntoUserContextMenu(mod: DefinitelyDefined<ContextMenuUser, 'name'>) {
        return this.setIntoApplicationStore(ApplicationCommandType.User, mod);
    }

    setIntoEventEmitters(mod: EventEmitter) {
        return ModuleManager.setIntoMap(this.ExternalEventEmitters,mod.constructor.name, mod);
    }

    setIntoModalStore(mod: DefinitelyDefined<ModalSubmitCommand, 'name'>) {
        return ModuleManager.setIntoMap(this.ModalSubmitCommands, mod.name, mod);
    }

    getFromBoth(name: string) {
        return ModuleManager.getFromMap(this.BothCommands, name);
    }

    getFromSlash(name: string) {
        return this.getFromApplicationType(ApplicationCommandType.ChatInput, name);
    }
    /**
     *  Checks both aliases and text command map
     */
    getFromText(name: string) {
        return (
            ModuleManager.getFromMap(this.TextCommands.text, name) ??
            ModuleManager.getFromMap(this.TextCommands.aliases, name)
        );
    }
    getFromMessageContextMenu(name: string) {
        return this.getFromApplicationType(ApplicationCommandType.Message, name);
    }

    getFromUserContextMenu(name: string) {
        return this.getFromApplicationType(ApplicationCommandType.User, name);
    }

    getExternalEventEmitter(name: string) {
        return ModuleManager.getFromMap(this.ExternalEventEmitters, name);
    }

    getModalHandler(name: string) {
        return ModuleManager.getFromMap(this.ModalSubmitCommands, name);
    }
}
