import type { ApplicationCommandOptionData, AutocompleteInteraction, Awaitable, ButtonInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, SelectMenuInteraction } from 'discord.js';
import type { Override } from '../../../../types/handler';
import type { CommandType } from '../../../sern';
import type { BaseModule } from '../module';


type AutoComp =  {
    update : (ctx : AutocompleteInteraction) => Awaitable<void>
}
//possible refactoring to interfaces and not types
export type TextCommand = {
    type : CommandType.Text;
    alias : string[] | [],
} & BaseModule;

export type SlashCommand = {
    type : CommandType.Slash;
    options : ApplicationCommandOptionData[] | [],
} & BaseModule; 

export type BothCommand = {
    type : CommandType.Both; 
    alias : string[] | [];
    options : ApplicationCommandOptionData[] | [],
} & BaseModule;

export type ContextMenuUser = {
    type : CommandType.MenuUser;
} & Override<BaseModule, { execute : ( ctx: ContextMenuCommandInteraction ) => Awaitable<void> }>;
export type ContextMenuMsg = {
    type : CommandType.MenuMsg;
} & Override<BaseModule, { execute : ( ctx: MessageContextMenuCommandInteraction ) => Awaitable<void> }>;
export type ButtonCommand = {
    type : CommandType.Button;
} & Override<BaseModule, { execute : (ctx :ButtonInteraction ) => Awaitable<void> }>;
export type SelectMenuCommand = {
    type : CommandType.MenuSelect;
} & Override<BaseModule, { execute : (ctx : SelectMenuInteraction ) => Awaitable<void> }>;


export type Module = 
    TextCommand 
    | SlashCommand 
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | SelectMenuCommand;
          
