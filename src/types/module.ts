import type {
    ApplicationCommandAttachmentOption,
    ApplicationCommandChannelOptionData,
    ApplicationCommandChoicesData,
    ApplicationCommandNonOptionsData,
    ApplicationCommandNumericOptionData,
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    ApplicationCommandSubCommandData,
    ApplicationCommandSubGroupData,
    BaseApplicationCommandOptionsData,
} from 'discord.js';
import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ClientEvents,
    MentionableSelectMenuInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserContextMenuCommandInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';
import { InitArgs } from './core';
import { Args, Payload, SlashOptions } from '../types/handler';
import { Context } from '../classic/context';
import { Processed } from '../types/core';
import { CommandType, PluginType } from '../core/structures/enums';
import type { Awaitable, SernEventsMapping } from './handler';
import type { InitPlugin, ControlPlugin } from './plugin';
import { EventType } from '../core/structures/enums';
import type { AnyCommandPlugin, AnyEventPlugin } from './plugin';
import { sernMeta } from '../commands';

interface CommandMeta {
    fullPath: string;
    id: string;
}

export interface Module {
    type: CommandType | EventType;
    name?: string;
    onEvent: ControlPlugin[];
    plugins: InitPlugin[];
    description?: string;
    [sernMeta]: CommandMeta;
    execute: (...args: any[]) => Awaitable<any>;
}
export interface CommandTypeModule extends Module {
    type: CommandType;
}
export interface EventTypeModule extends Module {
    type: EventType;
}
export interface SernEventCommand<T extends keyof SernEventsMapping = keyof SernEventsMapping>
    extends Module {
    name?: T;
    type: EventType.Sern;
    execute(...args: SernEventsMapping[T]): Awaitable<unknown>;
}
export interface ExternalEventCommand extends Module {
    name?: string;
    emitter: string;
    type: EventType.External;
    execute(...args: unknown[]): Awaitable<unknown>;
}

export interface ContextMenuUser extends Module {
    type: CommandType.CtxUser;
    execute: (ctx: UserContextMenuCommandInteraction) => Awaitable<unknown>;
}

export interface ContextMenuMsg extends Module {
    type: CommandType.CtxMsg;
    execute: (ctx: MessageContextMenuCommandInteraction) => Awaitable<unknown>;
}

export interface ButtonCommand extends Module {
    type: CommandType.Button;
    execute: (ctx: ButtonInteraction) => Awaitable<unknown>;
}

export interface StringSelectCommand extends Module {
    type: CommandType.StringSelect;
    execute: (ctx: StringSelectMenuInteraction) => Awaitable<unknown>;
}

export interface ChannelSelectCommand extends Module {
    type: CommandType.ChannelSelect;
    execute: (ctx: ChannelSelectMenuInteraction) => Awaitable<unknown>;
}

export interface RoleSelectCommand extends Module {
    type: CommandType.RoleSelect;
    execute: (ctx: RoleSelectMenuInteraction) => Awaitable<unknown>;
}

export interface MentionableSelectCommand extends Module {
    type: CommandType.MentionableSelect;
    execute: (ctx: MentionableSelectMenuInteraction) => Awaitable<unknown>;
}

export interface UserSelectCommand extends Module {
    type: CommandType.UserSelect;
    execute: (ctx: UserSelectMenuInteraction) => Awaitable<unknown>;
}

export interface ModalSubmitCommand extends Module {
    type: CommandType.Modal;
    execute: (ctx: ModalSubmitInteraction) => Awaitable<unknown>;
}

export interface AutocompleteCommand
    extends Omit<Module, 'name' | 'type' | 'plugins' | 'description' | typeof sernMeta> {
    onEvent: ControlPlugin[];
    execute: (ctx: AutocompleteInteraction) => Awaitable<unknown>;
}

export interface DiscordEventCommand<T extends keyof ClientEvents = keyof ClientEvents>
    extends Module {
    name?: T;
    type: EventType.Discord;
    execute(...args: ClientEvents[T]): Awaitable<unknown>;
}
export interface TextCommand extends Module {
    type: CommandType.Text;
    alias?: string[];
    execute: (ctx: Context, args: ['text', string[]]) => Awaitable<unknown>;
}

export interface SlashCommand extends Module {
    type: CommandType.Slash;
    description: string;
    options?: SernOptionsData[];
    execute: (ctx: Context, args: ['slash', SlashOptions]) => Awaitable<unknown>;
}

export interface BothCommand extends Module {
    type: CommandType.Both;
    alias?: string[];
    description: string;
    options?: SernOptionsData[];
    execute: (ctx: Context, args: Args) => Awaitable<unknown>;
}
export interface CommandArgsMatrix {
    [CommandType.Text]: {
        [PluginType.Control]: [Context, ['text', string[]]];
        [PluginType.Init]: [InitArgs<Processed<TextCommand>>];
    };
    [CommandType.Slash]: {
        [PluginType.Control]: [Context, ['slash', /* library coupled */ SlashOptions]];
        [PluginType.Init]: [InitArgs<Processed<SlashCommand>>];
    };
    [CommandType.Both]: {
        [PluginType.Control]: [Context, Args];
        [PluginType.Init]: [InitArgs<Processed<BothCommand>>];
    };
    [CommandType.CtxMsg]: {
        [PluginType.Control]: [/* library coupled */ MessageContextMenuCommandInteraction];
        [PluginType.Init]: [InitArgs<Processed<ContextMenuMsg>>];
    };
    [CommandType.CtxUser]: {
        [PluginType.Control]: [/* library coupled */ UserContextMenuCommandInteraction];
        [PluginType.Init]: [InitArgs<Processed<ContextMenuUser>>];
    };
    [CommandType.Button]: {
        [PluginType.Control]: [/* library coupled */ ButtonInteraction];
        [PluginType.Init]: [InitArgs<Processed<ButtonCommand>>];
    };
    [CommandType.StringSelect]: {
        [PluginType.Control]: [/* library coupled */ StringSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<StringSelectCommand>>];
    };
    [CommandType.RoleSelect]: {
        [PluginType.Control]: [/* library coupled */ RoleSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<RoleSelectCommand>>];
    };
    [CommandType.ChannelSelect]: {
        [PluginType.Control]: [/* library coupled */ ChannelSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<ChannelSelectCommand>>];
    };
    [CommandType.MentionableSelect]: {
        [PluginType.Control]: [/* library coupled */ MentionableSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<MentionableSelectCommand>>];
    };
    [CommandType.UserSelect]: {
        [PluginType.Control]: [/* library coupled */ UserSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<UserSelectCommand>>];
    };
    [CommandType.Modal]: {
        [PluginType.Control]: [/* library coupled */ ModalSubmitInteraction];
        [PluginType.Init]: [InitArgs<Processed<ModalSubmitCommand>>];
    };
}

export interface EventArgsMatrix {
    [EventType.Discord]: {
        [PluginType.Control]: /* library coupled */ ClientEvents[keyof ClientEvents];
        [PluginType.Init]: [InitArgs<Processed<DiscordEventCommand>>];
    };
    [EventType.Sern]: {
        [PluginType.Control]: [Payload];
        [PluginType.Init]: [InitArgs<Processed<SernEventCommand>>];
    };
    [EventType.External]: {
        [PluginType.Control]: unknown[];
        [PluginType.Init]: [InitArgs<Processed<ExternalEventCommand>>];
    };
}
export type EventModule = DiscordEventCommand | SernEventCommand | ExternalEventCommand;
export type CommandModule =
    | TextCommand
    | SlashCommand
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | StringSelectCommand
    | MentionableSelectCommand
    | UserSelectCommand
    | ChannelSelectCommand
    | RoleSelectCommand
    | ModalSubmitCommand;

export type AnyModule = CommandModule | EventModule;

//https://stackoverflow.com/questions/64092736/alternative-to-switch-statement-for-typescript-discriminated-union
// Explicit Module Definitions for mapping
export interface CommandModuleDefs {
    [CommandType.Text]: TextCommand;
    [CommandType.Slash]: SlashCommand;
    [CommandType.Both]: BothCommand;
    [CommandType.CtxMsg]: ContextMenuMsg;
    [CommandType.CtxUser]: ContextMenuUser;
    [CommandType.Button]: ButtonCommand;
    [CommandType.StringSelect]: StringSelectCommand;
    [CommandType.RoleSelect]: RoleSelectCommand;
    [CommandType.ChannelSelect]: ChannelSelectCommand;
    [CommandType.MentionableSelect]: MentionableSelectCommand;
    [CommandType.UserSelect]: UserSelectCommand;
    [CommandType.Modal]: ModalSubmitCommand;
}

export interface EventModuleDefs {
    [EventType.Sern]: SernEventCommand;
    [EventType.Discord]: DiscordEventCommand;
    [EventType.External]: ExternalEventCommand;
}

export interface SernAutocompleteData
    extends Omit<BaseApplicationCommandOptionsData, 'autocomplete'> {
    autocomplete: true;
    type:
        | ApplicationCommandOptionType.String
        | ApplicationCommandOptionType.Number
        | ApplicationCommandOptionType.Integer;
    command: AutocompleteCommand;
}

export type CommandModuleNoPlugins = {
    [T in CommandType]: Omit<CommandModuleDefs[T], 'plugins' | 'onEvent' | typeof sernMeta>;
};
export type EventModulesNoPlugins = {
    [T in EventType]: Omit<EventModuleDefs[T], 'plugins' | 'onEvent' | typeof sernMeta>;
};

export type InputEvent = {
    [T in EventType]: EventModulesNoPlugins[T] & { plugins?: AnyEventPlugin[] };
}[EventType];

export type InputCommand = {
    [T in CommandType]: CommandModuleNoPlugins[T] & { plugins?: AnyCommandPlugin[] };
}[CommandType];

/**
 * Type that replaces autocomplete with {@link SernAutocompleteData}
 */
export type BaseOptions =
    | ApplicationCommandChoicesData
    | ApplicationCommandNonOptionsData
    | ApplicationCommandChannelOptionData
    | ApplicationCommandNumericOptionData
    | ApplicationCommandAttachmentOption
    | SernAutocompleteData;

export interface SernSubCommandData extends BaseApplicationCommandOptionsData {
    type: ApplicationCommandOptionType.Subcommand;
    required?: never;
    options?: BaseOptions[];
}

export interface SernSubCommandGroupData extends BaseApplicationCommandOptionsData {
    type: ApplicationCommandOptionType.SubcommandGroup;
    required?: never;
    options?: SernSubCommandData[];
}

export type SernOptionsData<U extends ApplicationCommandOptionData = ApplicationCommandOptionData> =
    U extends ApplicationCommandSubCommandData
        ? SernSubCommandData
        : U extends ApplicationCommandSubGroupData
        ? SernSubCommandGroupData
        : BaseOptions;
