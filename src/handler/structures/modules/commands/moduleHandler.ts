import type { SernPlugin } from '../../../plugins/plugin';
import { CommandType } from '../../../sern';
import type {
    BothCommand,
    ButtonCommand,
    ContextMenuMsg,
    ContextMenuUser,
    SelectMenuCommand,
    SlashCommand,
    TextCommand,
} from './module';
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

//Keys of ModuleDefs
export type ModuleType = keyof ModuleDefs;
// The keys mapped to a constructed union with its type
export type ModuleStates = {
    [K in ModuleType]: { type: K } & ModuleDefs[K];
};
// A handler callback that is called on each ModuleDef
export type HandlerCallback<K extends ModuleType> = (mod: ModuleStates[K], plugins: SernPlugin<K>[]) => unknown;
//An object that acts as the mapped object to handler
export type ModuleHandlers = { [K in ModuleType]: HandlerCallback<K> };
