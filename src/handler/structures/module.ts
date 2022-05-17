import type {
    ApplicationCommandOptionData,
    Awaitable,
    ButtonInteraction,
    MessageContextMenuCommandInteraction,
    SelectMenuInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import type { Override } from '../../types/handler';
import type { Args } from '../../types/handler';
import type { CommandType } from '../sern';
import type { CommandPlugin, EventPlugin } from '../plugins/plugin';
import type Context from './context';

export interface BaseModule {
    name?: string;
    description: string;
    execute: (ctx: Context, args: Args) => Awaitable<void>;
}

//possible refactoring types into interfaces and not types
export type TextCommand = {
    type: CommandType.Text;
    onEvent: EventPlugin<CommandType.Text>[];
    plugins: CommandPlugin[];
    alias: string[] | [];
} & BaseModule;

export type SlashCommand = {
    type: CommandType.Slash;
    onEvent: EventPlugin<CommandType.Slash>[];
    plugins: CommandPlugin[];
    options: ApplicationCommandOptionData[] | [];
} & BaseModule;

export type BothCommand = {
    type: CommandType.Both;
    onEvent: EventPlugin<CommandType.Both>[]
    plugins: CommandPlugin[]
    alias: string[] | [];
    options: ApplicationCommandOptionData[] | [];
} & BaseModule;

export type ContextMenuUser = {
    type: CommandType.MenuUser;
    onEvent: EventPlugin<CommandType.MenuUser>[];
    plugins: CommandPlugin[];
} & Override<BaseModule, { execute: (ctx: UserContextMenuCommandInteraction) => Awaitable<void> }>;

export type ContextMenuMsg = {
    type: CommandType.MenuMsg;
    onEvent: EventPlugin<CommandType.MenuMsg>[];
    plugins: CommandPlugin[];
} & Override<BaseModule, { execute: (ctx: MessageContextMenuCommandInteraction) => Awaitable<void> }>;

export type ButtonCommand = {
    type: CommandType.Button;
    onEvent: EventPlugin<CommandType.Button>[];
    plugins: CommandPlugin[];
} & Override<BaseModule, { execute: (ctx: ButtonInteraction) => Awaitable<void> }>;

export type SelectMenuCommand = {
    type: CommandType.MenuSelect;
    onEvent: EventPlugin<CommandType.MenuSelect>[];
    plugins: CommandPlugin[];
} & Override<BaseModule, { execute: (ctx: SelectMenuInteraction) => Awaitable<void> }>;

export type Module =
    | TextCommand
    | SlashCommand
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | SelectMenuCommand;

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
};