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
    UserContextMenuCommandInteraction,
    ChannelSelectMenuInteraction,
    MentionableSelectMenuInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction
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
import type { UserSelectMenuInteraction } from 'discord.js';

export interface Module {
    type?: CommandType | EventType;
    name?: string;
    description?: string;
    execute: (...args: any[]) => any
}

export interface TextCommand extends Module {
    type: CommandType.Text;
    onEvent: EventPlugin<CommandType.Text>[];
    plugins: CommandPlugin[];
    alias?: string[];
    execute: (ctx: Context, args: ['text', string[]]) => Awaitable<unknown>;
}

export interface SlashCommand extends Module {
    type: CommandType.Slash;
    onEvent: EventPlugin<CommandType.Slash>[];
    plugins: CommandPlugin[];
    options?: SernOptionsData[];
    execute: (ctx: Context, args: ['slash', SlashOptions]) => Awaitable<unknown>;
}

export interface BothCommand extends Module {
    type: CommandType.Both;
    onEvent: EventPlugin<CommandType.Both>[];
    plugins: CommandPlugin[];
    alias?: string[];
    options?: SernOptionsData[];
    execute: (ctx: Context, args: Args) => Awaitable<unknown>;
}

export interface ContextMenuUser extends Module {
    type: CommandType.CtxUser;
    onEvent: EventPlugin<CommandType.CtxUser>[];
    plugins: CommandPlugin[];
    execute: (ctx: UserContextMenuCommandInteraction) => Awaitable<unknown>;
}

export interface ContextMenuMsg extends Module {
    type: CommandType.CtxMsg;
    onEvent: EventPlugin<CommandType.CtxMsg>[];
    plugins: CommandPlugin[];
    execute: (ctx: MessageContextMenuCommandInteraction) => Awaitable<unknown>;
}

export interface ButtonCommand extends Module {
    type: CommandType.Button;
    onEvent: EventPlugin<CommandType.Button>[];
    plugins: CommandPlugin[];
    execute: (ctx: ButtonInteraction) => Awaitable<unknown>;
}

export interface StringSelectCommand extends Module {
    type: CommandType.StringSelect;
    onEvent: EventPlugin<CommandType.StringSelect>[];
    plugins: CommandPlugin[];
    execute: (ctx: StringSelectMenuInteraction) => Awaitable<unknown>;
}

export interface ChannelSelectCommand extends Module {
    type: CommandType.ChannelSelect;
    onEvent: EventPlugin<CommandType.ChannelSelect>[];
    plugins: CommandPlugin[];
    execute: (ctx: ChannelSelectMenuInteraction) => Awaitable<unknown>;
}

export interface RoleSelectCommand extends Module {
    type: CommandType.RoleSelect;
    onEvent: EventPlugin<CommandType.RoleSelect>[];
    plugins: CommandPlugin[];
    execute: (ctx: RoleSelectMenuInteraction) => Awaitable<unknown>;
}

export interface MentionableSelectCommand extends Module {
    type: CommandType.MentionableSelect;
    onEvent: EventPlugin<CommandType.MentionableSelect>[];
    plugins: CommandPlugin[];
    execute: (ctx: MentionableSelectMenuInteraction) => Awaitable<unknown>;
}

export interface UserSelectCommand extends Module {
    type: CommandType.UserSelect;
    onEvent: EventPlugin<CommandType.UserSelect>[];
    plugins: CommandPlugin[];
    execute: (ctx: UserSelectMenuInteraction) => Awaitable<unknown>;
}

export interface ModalSubmitCommand extends Module {
    type: CommandType.Modal;
    onEvent: EventPlugin<CommandType.Modal>[];
    plugins: CommandPlugin[];
    execute: (ctx: ModalSubmitInteraction) => Awaitable<unknown>;
}

export interface AutocompleteCommand extends Module {
    name?: never;
    description?: never;
    type?: never;
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
    | StringSelectCommand
    | MentionableSelectCommand
    | UserSelectCommand
    | ChannelSelectCommand
    | RoleSelectCommand
    | ModalSubmitCommand;

export type AnyModule = CommandModule | EventModule;

//https://stackoverflow.com/questions/64092736/alternative-to-switch-statement-for-typescript-discriminated-union
// Explicit Module Definitions for mapping
export type CommandModuleDefs = {
    [CommandType.Text]: TextCommand;
    [CommandType.Slash]: SlashCommand;
    [CommandType.Both]: BothCommand;
    [CommandType.CtxMsg]: ContextMenuMsg;
    [CommandType.CtxUser]: ContextMenuUser;
    [CommandType.Button]: ButtonCommand;
    [CommandType.StringSelect]: StringSelectCommand;
    [CommandType.RoleSelect] : RoleSelectCommand;
    [CommandType.ChannelSelect] : ChannelSelectCommand;
    [CommandType.MentionableSelect] : MentionableSelectCommand;
    [CommandType.UserSelect] : UserSelectCommand;
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