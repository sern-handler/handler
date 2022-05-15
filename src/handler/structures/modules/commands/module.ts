import type {
    ApplicationCommandOptionData,
    Awaitable,
    ButtonInteraction,
    MessageContextMenuCommandInteraction,
    SelectMenuInteraction,
} from 'discord.js';
import type { Override } from '../../../../types/handler';
import type { CommandType } from '../../../sern';
import type { BaseModule } from '../module';
import type { UserContextMenuCommandInteraction } from 'discord.js';
import type { CommandPlugin, EventPlugin } from '../../../plugins/plugin';

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
    onEvent: EventPlugin<CommandType.MenuUser>[];
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
