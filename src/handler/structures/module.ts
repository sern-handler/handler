import type {
    ApplicationCommandAttachmentOption,
    ApplicationCommandChannelOptionData,
    ApplicationCommandChoicesData,
    ApplicationCommandNonOptionsData,
    ApplicationCommandNumericOptionData,
    ApplicationCommandOptionData,
    ApplicationCommandSubCommandData,
    ApplicationCommandSubGroupData,
    Awaitable,
    BaseApplicationCommandOptionsData,
    ButtonInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import type { Args, Override } from '../../types/handler';
import type { CommandPlugin, EventPlugin } from '../plugins/plugin';
import type Context from './context';
import { CommandType, PluginType } from './enums';
import type { AutocompleteInteraction } from 'discord.js';
import type { ApplicationCommandOptionType } from 'discord.js';
import { ChatInputCommandInteraction, Message } from 'discord.js';

export interface BaseModule {
    type: CommandType | PluginType;
    name?: string;
    description: string;
    execute: (ctx: Context, args: Args) => Awaitable<void>;
}

//possible refactoring types into interfaces and not types
export type TextCommand = Override<
    BaseModule,
    {
        type: CommandType.Text;
        onEvent?: EventPlugin<CommandType.Text>[];
        plugins?: CommandPlugin[];
        alias?: string[];
    }
>;

export type SlashCommand = Override<
    BaseModule,
    {
        type: CommandType.Slash;
        onEvent?: EventPlugin<CommandType.Slash>[];
        plugins?: CommandPlugin[];
        options?: SernOptionsData[];
    }
>;

export type BothCommand = Override<
    BaseModule,
    {
        type: CommandType.Both;
        onEvent?: EventPlugin<CommandType.Both>[];
        plugins?: CommandPlugin[];
        alias?: string[];
        options?: SernOptionsData[];
    }
>;

export type ContextMenuUser = Override<
    BaseModule,
    {
        type: CommandType.MenuUser;
        onEvent?: EventPlugin<CommandType.MenuUser>[];
        plugins?: CommandPlugin[];
        execute: (ctx: UserContextMenuCommandInteraction) => Awaitable<void>;
    }
>;

export type ContextMenuMsg = Override<
    BaseModule,
    {
        type: CommandType.MenuMsg;
        onEvent?: EventPlugin<CommandType.MenuMsg>[];
        plugins?: CommandPlugin[];
        execute: (ctx: MessageContextMenuCommandInteraction) => Awaitable<void>;
    }
>;

export type ButtonCommand = Override<
    BaseModule,
    {
        type: CommandType.Button;
        onEvent?: EventPlugin<CommandType.Button>[];
        plugins?: CommandPlugin[];
        execute: (ctx: ButtonInteraction) => Awaitable<void>;
    }
>;

export type SelectMenuCommand = Override<
    BaseModule,
    {
        type: CommandType.MenuSelect;
        onEvent?: EventPlugin<CommandType.MenuSelect>[];
        plugins?: CommandPlugin[];
        execute: (ctx: SelectMenuInteraction) => Awaitable<void>;
    }
>;

export type ModalSubmitCommand = Override<
    BaseModule,
    {
        type: CommandType.Modal;
        onEvent?: EventPlugin<CommandType.Modal>[];
        plugins?: CommandPlugin[];
        execute: (ctx: ModalSubmitInteraction) => Awaitable<void>;
    }
>;

// Autocomplete commands are a little different
// They can't have command plugins as they are
// in conjunction with chat input commands
// TODO: possibly in future, allow Autocmp commands in separate files?
export type AutocompleteCommand = Override<
    BaseModule,
    {
        name: string;
        type: CommandType.Autocomplete;
        onEvent?: EventPlugin<CommandType.Autocomplete>[];
        execute: (ctx: AutocompleteInteraction) => Awaitable<void>;
    }
>;

export type Module =
    | TextCommand
    | SlashCommand
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | SelectMenuCommand
    | ModalSubmitCommand
    | AutocompleteCommand;

//https://stackoverflow.com/questions/64092736/alternative-to-switch-statement-for-typescript-discriminated-union
// Explicit Module Definitions for mapping
export type ModuleDefs = {
    [CommandType.Text]: TextCommand;
    [CommandType.Slash]: SlashCommand;
    [CommandType.Both]: BothCommand;
    [CommandType.MenuMsg]: ContextMenuMsg;
    [CommandType.MenuUser]: ContextMenuUser;
    [CommandType.Button]: ButtonCommand;
    [CommandType.MenuSelect]: SelectMenuCommand;
    [CommandType.Modal]: ModalSubmitCommand;
    [CommandType.Autocomplete]: AutocompleteCommand;
};

export type InteractionDefs = {
    [CommandType.Text]: Context;
    [CommandType.Slash]: Context;
    [CommandType.Both]: Context;
    [CommandType.MenuMsg]: MessageContextMenuCommandInteraction;
    [CommandType.MenuUser]: UserContextMenuCommandInteraction;
    [CommandType.Button]: ButtonInteraction;
    [CommandType.MenuSelect]: SelectMenuInteraction;
    [CommandType.Modal]: ModalSubmitInteraction;
    [CommandType.Autocomplete]: AutocompleteInteraction;
};

//TODO: support deeply nested Autocomplete
// objective: construct union of ApplicationCommandOptionData change any Autocomplete data
// into Sern autocomplete data.

export type SernAutocompleteData = Override<
    BaseApplicationCommandOptionsData,
    {
        autocomplete: true;
        type:
            | ApplicationCommandOptionType.String
            | ApplicationCommandOptionType.Number
            | ApplicationCommandOptionType.Integer;
        command: Omit<AutocompleteCommand, 'type' | 'name' | 'description'>;
    }
>;

/**
 * Type that just uses SernAutocompleteData and not regular autocomplete
 */
export type BaseOptions =
    | ApplicationCommandChoicesData
    | ApplicationCommandNonOptionsData
    | ApplicationCommandChannelOptionData
    | ApplicationCommandNumericOptionData
    | ApplicationCommandAttachmentOption
    | SernAutocompleteData;

export type SernSubCommandData = Override<
    Omit<BaseApplicationCommandOptionsData, 'required'>,
    {
        type: ApplicationCommandOptionType.Subcommand;
        options?: BaseOptions[];
    }
>;

export type SernSubCommandGroupData = Override<
    Omit<BaseApplicationCommandOptionsData, 'required'>,
    {
        type: ApplicationCommandOptionType.SubcommandGroup;
        options?: SernSubCommandData[];
    }
>;

export type SernOptionsData<U extends ApplicationCommandOptionData = ApplicationCommandOptionData> =
    U extends ApplicationCommandSubCommandData
        ? SernSubCommandData
        : U extends ApplicationCommandSubGroupData
        ? SernSubCommandGroupData
        : BaseOptions;
