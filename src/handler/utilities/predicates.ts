import type { Module, ModuleDefs } from '../structures/module';
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
import type { DiscordEvent, EventEmitterRegister } from '../..';

export function correctModuleType<T extends keyof ModuleDefs>(
    plug: Module | undefined,
    type: T,
): plug is ModuleDefs[T] {
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

export function isPromise<T>(promiseLike: Awaitable<T>): promiseLike is Promise<T> {
    const keys = new Set(Object.keys(promiseLike));
    return keys.has('then') && keys.has('catch');
}

export function isDiscordEvent(el: DiscordEvent | EventEmitterRegister): el is DiscordEvent {
    return el.length === 2;
}
