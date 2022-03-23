import { CommandType } from "../../sern";
import type { TextCommand, BothCommand, SlashCommand, BaseModule }  from "./module";

//https://stackoverflow.com/questions/64092736/alternative-to-switch-statement-for-typescript-discriminated-union

// Explicit Module Definitions for mapping
export type ModuleDefs = {
    [CommandType.TEXT] : TextCommand,
    [CommandType.SLASH] : SlashCommand,
    [CommandType.BOTH] : BothCommand,
}

//Keys of ModuleDefs
export type ModuleType = keyof ModuleDefs;
// The keys mapped to a constructed union with its type
export type ModuleStates = { [ K in ModuleType ] : { type : K } & ModuleDefs[K] };
// A handler callback that is called on each ModuleDef 
export type HandlerCallback<K extends ModuleType> = ( params : ModuleStates[K] ) => unknown;
//An object that acts as the mapped object to handler
export type ModuleHandlers = { [K in ModuleType] : HandlerCallback<K> };

