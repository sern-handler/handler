import {
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ClientEvents,
    MentionableSelectMenuInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';
import { CommandType, Context, EventType, PluginType } from '../core/structures';
import type {
    AnyCommandPlugin,
    AnyEventPlugin,
    CommandArgs,
    ControlPlugin,
    EventArgs,
    InitPlugin,
} from '../types/core-plugin';
import type {
    CommandModule,
    EventModule,
    InputCommand,
    InputEvent,
    Module,
    SernOptionsData,
} from '../types/core-modules';
import { partitionPlugins } from './_internal';
import type { Args, Awaitable, SlashOptions } from '../types/utility';

/**
 * @since 1.0.0 The wrapper function to define command modules for sern
 * @param mod
 */
export function commandModule(mod: InputCommand): CommandModule {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return {
        ...mod,
        onEvent,
        plugins,
    } as CommandModule;
}

/**
 * @since 3.2.0 The wrapper function to create Both Commands for sern.
 * @param mod
 */
export function bothCommand(mod: {
    name?: string;
    description: string;
    options?: SernOptionsData[];
    plugins?: (InitPlugin | ControlPlugin)[];
    execute: (ctx: Context, options: Args) => Awaitable<unknown>;
}): CommandModule {
    return commandModule({
        type: CommandType.Both,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Slash Commands for sern.
 * @param mod
 */
export function slashCommand(mod: {
    name?: string;
    description: string;
    options?: SernOptionsData[];
    plugins?: (InitPlugin | ControlPlugin)[];
    execute: (ctx: Context, options: ['slash', SlashOptions]) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.Slash,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Text Commands for sern.
 * @param mod
 */
export function textCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: Context, options: ['text', string[]]) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.Text,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Modal Commands for sern.
 * @param mod
 */
export function modalCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: ModalSubmitInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.Modal,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Button Commands for sern.
 * @param mod
 */
export function buttonCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: ButtonInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.Button,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create String Select Menu Commands for sern.
 * @param mod
 */
export function stringSelectMenuCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: StringSelectMenuInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.StringSelect,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Mention Select Menu Commands for sern.
 * @param mod
 */
export function mentionableSelectMenuCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: MentionableSelectMenuInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.MentionableSelect,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Channel Select Menu Commands for sern.
 * @param mod
 */
export function channelSelectMenuCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: ChannelSelectMenuInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.ChannelSelect,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create User Select Menu Commands for sern.
 * @param mod
 */
export function userSelectMenuCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: UserSelectMenuInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.UserSelect,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Role Select Menu Commands for sern.
 * @param mod
 */
export function roleSelectMenuCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: RoleSelectMenuInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.RoleSelect,
        ...mod,
    });
}

/**
 * @since 3.2.0 The wrapper function to create Msg Context2 Menu Commands for sern.
 * @param mod
 */
export function msgContextMenuCommand(mod: {
    name?: string;
    description: string;
    plugins?: AnyCommandPlugin[];
    execute: (ctx: MessageContextMenuCommandInteraction) => Awaitable<unknown>;
}) {
    return commandModule({
        type: CommandType.CtxMsg,
        ...mod,
    });
}

/**
 * @since 1.0.0
 * The wrapper function to define event modules for sern
 * @param mod
 */
export function eventModule(mod: InputEvent): EventModule {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return {
        ...mod,
        plugins,
        onEvent,
    } as EventModule;
}

/** Create event modules from discord.js client events,
 * This is an {@link eventModule} for discord events,
 * where typings can be very bad.
 * @Experimental
 * @param mod
 */
export function discordEvent<T extends keyof ClientEvents>(mod: {
    name: T;
    plugins?: AnyEventPlugin[];
    execute: (...args: ClientEvents[T]) => Awaitable<unknown>;
}) {
    return eventModule({
        type: EventType.Discord,
        ...mod,
    });
}

function prepareClassPlugins(c: Module) {
    const [onEvent, initPlugins] = partitionPlugins(c.plugins);
    c.plugins = initPlugins as InitPlugin[];
    c.onEvent = onEvent as ControlPlugin[];
}
//
// Class modules:
// Can be refactored.
// Both implement singleton, could I make them inherit a singleton parent class?
/**
 * @Experimental
 * Will be refactored / changed in future
 */
export abstract class CommandExecutable<const Type extends CommandType = CommandType> {
    abstract type: Type;
    plugins?: AnyCommandPlugin[] = [];
    private static _instance: CommandModule;

    static getInstance() {
        if (!CommandExecutable._instance) {
            //@ts-ignore
            CommandExecutable._instance = new this();
            prepareClassPlugins(CommandExecutable._instance);
        }
        return CommandExecutable._instance;
    }

    abstract execute(...args: CommandArgs<Type, PluginType.Control>): Awaitable<unknown>;
}

/**
 * @Experimental
 * Will be refactored in future
 */
export abstract class EventExecutable<Type extends EventType> {
    abstract type: Type;
    plugins?: AnyEventPlugin[] = [];

    private static _instance: EventModule;
    static getInstance() {
        if (!EventExecutable._instance) {
            //@ts-ignore
            EventExecutable._instance = new this();
            prepareClassPlugins(EventExecutable._instance);
        }
        return EventExecutable._instance;
    }
    abstract execute(...args: EventArgs<Type, PluginType.Control>): Awaitable<unknown>;
}
