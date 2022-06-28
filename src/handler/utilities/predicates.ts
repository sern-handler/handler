import type { CommandModuleDefs, EventModule, Module } from '../structures/module';
import type {
    Awaitable,
    ButtonInteraction,
    ChatInputCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    MessageContextMenuCommandInteraction,
    SelectMenuInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import {
    AutocompleteInteraction,
    Interaction,
    InteractionType,
    ModalSubmitInteraction,
} from 'discord.js';
import type {
    DiscordEventCommand,
    ExternalEventCommand,
    SernEventCommand,
} from '../structures/events';
import { EventType } from '../..';

export function correctModuleType<T extends keyof CommandModuleDefs>(
    plug: Module | undefined,
    type: T,
): plug is CommandModuleDefs[T] {
    // Another way to check if type is equivalent,
    // It will check based on flag system instead
    return plug !== undefined && (plug.type & type) !== 0;
}

export function isChatInputCommand(i: CommandInteraction): i is ChatInputCommandInteraction {
    return i.isChatInputCommand();
}

export function isButton(i: MessageComponentInteraction): i is ButtonInteraction {
    return i.isButton();
}

export function isSelectMenu(i: MessageComponentInteraction): i is SelectMenuInteraction {
    return i.isSelectMenu();
}

export function isMessageCtxMenuCmd(
    i: CommandInteraction,
): i is MessageContextMenuCommandInteraction {
    return i.isMessageContextMenuCommand();
}

export function isUserContextMenuCmd(
    i: CommandInteraction,
): i is UserContextMenuCommandInteraction {
    return i.isUserContextMenuCommand();
}

export function isApplicationCommand(interaction: Interaction): interaction is CommandInteraction {
    return interaction.type === InteractionType.ApplicationCommand;
}

export function isModalSubmit(interaction: Interaction): interaction is ModalSubmitInteraction {
    return interaction.type === InteractionType.ModalSubmit;
}
export function isAutocomplete(interaction: Interaction): interaction is AutocompleteInteraction {
    return interaction.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isMessageComponent(
    interaction: Interaction,
): interaction is MessageComponentInteraction {
    return interaction.type === InteractionType.MessageComponent;
}

export function isPromise<T>(promiseLike: Awaitable<T>): promiseLike is PromiseLike<T> {
    const keys = new Set(Object.keys(promiseLike));
    return keys.has('then') && keys.has('catch');
}

export function isDiscordEvent(el: EventModule): el is DiscordEventCommand {
    return el.type === EventType.Discord;
}
export function isSernEvent(el: EventModule): el is SernEventCommand {
    return el.type === EventType.Sern;
}

export function isExternalEvent(el: EventModule): el is ExternalEventCommand {
    return el.type === EventType.External && 'emitter' in el;
}

// export function isEventPlugin<T extends CommandType>(
//     e: CommandModulePlugin<T>,
// ): e is EventPlugin<T> {
//     return e.type === PluginType.Event;
// }
// export function isCommandPlugin<T extends CommandType>(
//     e: CommandModulePlugin<T>,
// ): e is CommandPlugin<T> {
//     return !isEventPlugin(e);
// }
