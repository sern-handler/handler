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
    AutocompleteInteraction,
    Awaitable,
    BaseApplicationCommandOptionsData,
    ButtonInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import type {
    DiscordEventCommand,
    ExternalEventCommand,
    SernEventCommand,
} from '../handler/structures/events';
import { CommandType } from '../handler/structures/enums';
import type { Args, SlashOptions } from './handler';
import type Context from '../handler/structures/context';
import type { AutocompletePlugin, CommandPlugin, EventPlugin } from '../handler/plugins/plugin';
import { EventType } from '../handler/structures/enums';

export interface BaseModule {
    type: CommandType | EventType;
    name?: string;
    description?: string;
    execute: (...args: any[]) => unknown
}

export interface TextCommand extends BaseModule {
    type: CommandType.Text;
    onEvent: EventPlugin<CommandType.Text>[];
    plugins: CommandPlugin[];
    alias?: string[];
    execute: (ctx: Context, args: ['text', string[]]) => Awaitable<unknown>;
}

export interface SlashCommand extends BaseModule {
    type: CommandType.Slash;
    onEvent: EventPlugin<CommandType.Slash>[];
    plugins: CommandPlugin[];
    options?: SernOptionsData[];
    execute: (ctx: Context, args: ['slash', SlashOptions]) => Awaitable<unknown>;
}

export interface BothCommand extends BaseModule {
    type: CommandType.Both;
    onEvent: EventPlugin<CommandType.Both>[];
    plugins: CommandPlugin[];
    alias?: string[];
    options?: SernOptionsData[];
    execute: (ctx: Context, args: Args) => Awaitable<unknown>;
}

export interface ContextMenuUser extends BaseModule {
    type: CommandType.MenuUser;
    onEvent: EventPlugin<CommandType.MenuUser>[];
    plugins: CommandPlugin[];
    execute: (ctx: UserContextMenuCommandInteraction) => Awaitable<unknown>;
}

export interface ContextMenuMsg extends BaseModule {
    type: CommandType.MenuMsg;
    onEvent: EventPlugin<CommandType.MenuMsg>[];
    plugins: CommandPlugin[];
    execute: (ctx: MessageContextMenuCommandInteraction) => Awaitable<unknown>;
}

export interface ButtonCommand extends BaseModule {
    type: CommandType.Button;
    onEvent: EventPlugin<CommandType.Button>[];
    plugins: CommandPlugin[];
    execute: (ctx: ButtonInteraction) => Awaitable<unknown>;
}

export interface SelectMenuCommand extends BaseModule {
    type: CommandType.MenuSelect;
    onEvent: EventPlugin<CommandType.MenuSelect>[];
    plugins: CommandPlugin[];
    execute: (ctx: SelectMenuInteraction) => Awaitable<unknown>;
}

export interface ModalSubmitCommand extends BaseModule {
    type: CommandType.Modal;
    onEvent: EventPlugin<CommandType.Modal>[];
    plugins: CommandPlugin[];
    execute: (ctx: ModalSubmitInteraction) => Awaitable<unknown>;
}

export interface AutocompleteCommand extends BaseModule {
    name: never;
    description: never;
    type: never;
    onEvent: AutocompletePlugin[];
    execute: (ctx: AutocompleteInteraction) => Awaitable<unknown>;
}

export type EventModule = DiscordEventCommand | SernEventCommand | ExternalEventCommand;
export type CommandModule =
    | TextCommand
    | SlashCommand
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | SelectMenuCommand
    | ModalSubmitCommand;

export type Module = CommandModule | EventModule;

//https://stackoverflow.com/questions/64092736/alternative-to-switch-statement-for-typescript-discriminated-union
// Explicit Module Definitions for mapping
export type CommandModuleDefs = {
    [CommandType.Text]: TextCommand;
    [CommandType.Slash]: SlashCommand;
    [CommandType.Both]: BothCommand;
    [CommandType.MenuMsg]: ContextMenuMsg;
    [CommandType.MenuUser]: ContextMenuUser;
    [CommandType.Button]: ButtonCommand;
    [CommandType.MenuSelect]: SelectMenuCommand;
    [CommandType.Modal]: ModalSubmitCommand;
};

export type EventModuleDefs = {
    [EventType.Sern]: SernEventCommand;
    [EventType.Discord]: DiscordEventCommand;
    [EventType.External]: ExternalEventCommand;
};

export interface SernAutocompleteData extends Omit<BaseApplicationCommandOptionsData, 'autocomplete'> {
    autocomplete: true;
    type:
        | ApplicationCommandOptionType.String
        | ApplicationCommandOptionType.Number
        | ApplicationCommandOptionType.Integer;
    command: AutocompleteCommand;
}

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
    required: never;
    options?: BaseOptions[];
}

export interface SernSubCommandGroupData extends BaseApplicationCommandOptionsData {
    type: ApplicationCommandOptionType.SubcommandGroup;
    required: never;
    options?: SernSubCommandData[];
}

export type SernOptionsData<U extends ApplicationCommandOptionData = ApplicationCommandOptionData> =
    U extends ApplicationCommandSubCommandData
        ? SernSubCommandData
        : U extends ApplicationCommandSubGroupData
        ? SernSubCommandGroupData
        : BaseOptions;