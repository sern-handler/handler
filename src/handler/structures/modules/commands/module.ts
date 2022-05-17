import type { ApplicationCommandOptionData, Awaitable, ButtonInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, SelectMenuInteraction } from 'discord.js';
import type { Override } from '../../../../types/handler';
import type { CommandType } from '../../../sern';
import type { BaseModule } from '../module';

// TODO: Possible refactoring to interfaces and not types
export type TextCommand = {
    type : CommandType.TEXT;
    alias : string[] | [],
} & BaseModule;

export type SlashCommand = {
    type : CommandType.SLASH;
    options : ApplicationCommandOptionData[] | [],
} & BaseModule; 

export type BothCommand = {
    type : CommandType.BOTH; 
    alias : string[] | [];
    options : ApplicationCommandOptionData[] | [],
} & BaseModule;

export type ContextMenuUser = {
    type : CommandType.MENU_USER;
} & Override<BaseModule, { execute : ( ctx: ContextMenuCommandInteraction ) => Awaitable<void> }>;
export type ContextMenuMsg = {
    type : CommandType.MENU_MSG;
} & Override<BaseModule, { execute : ( ctx: MessageContextMenuCommandInteraction ) => Awaitable<void> }>;
export type ButtonCommand = {
    type : CommandType.BUTTON;
} & Override<BaseModule, { execute : (ctx :ButtonInteraction ) => Awaitable<void> }>;
export type SelectMenuCommand = {
    type : CommandType.MENU_SELECT;
} & Override<BaseModule, { execute : (ctx : SelectMenuInteraction ) => Awaitable<void> }>;


export type Module = 
    TextCommand 
    | SlashCommand 
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | SelectMenuCommand;
          
