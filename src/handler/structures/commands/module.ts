import type { ApplicationCommandOptionData, Awaitable, ButtonInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, Interaction, MessageContextMenuCommandInteraction, SelectMenuInteraction } from 'discord.js';
import type { Args, Override } from '../../../types/handler';
import type { CommandType } from '../../sern';
import type Context from '../context';

type executeSlash = { execute : (ctx : Context<ChatInputCommandInteraction>, args: Args) => Awaitable<void> };

export interface BaseModule {
    name? : string;
    description : string;
    execute: (ctx: Context<Interaction>, args: Args) => Awaitable<void>;
}
export type TextCommand = {
    type : CommandType.TEXT;
    alias : string[] | [],
} & BaseModule;

export type SlashCommand = {
    type : CommandType.SLASH;
    options : ApplicationCommandOptionData[] | [],
} & Override<BaseModule, executeSlash>;

export type BothCommand = {
    type : CommandType.BOTH; 
    alias : string[] | [];
    options : ApplicationCommandOptionData[] | [],
} & Override<BaseModule, executeSlash>;

export type ContextMenuUser = {
    type : CommandType.MENU_USER;
} & Override<BaseModule, { execute : ( ctx: Context<ContextMenuCommandInteraction> ) => Awaitable<void> }>;

export type ContextMenuMsg = {
    type : CommandType.MENU_MSG;
} & Override<BaseModule, { execute : ( ctx: Context<MessageContextMenuCommandInteraction> ) => Awaitable<void> }>;
export type ButtonCommand = {
    type : CommandType.BUTTON;
} & Override<BaseModule, { execute : (ctx : Context<ButtonInteraction> ) => Awaitable<void> }>;

export type SelectMenuCommand = {
    type : CommandType.MENU_SELECT;
} & Override<BaseModule, { execute : (ctx : Context<SelectMenuInteraction> ) => Awaitable<void> }>;

export type Module = 
    TextCommand 
    | SlashCommand 
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | SelectMenuCommand;
          
