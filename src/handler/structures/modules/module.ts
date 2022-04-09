import type { Awaitable, ChatInputCommandInteraction, Interaction } from "discord.js";
import type { Args, Module } from "../../..";
import type { CommandPlugin, EventPlugin, SernPlugin } from "../../plugins/plugin";
import type Context from "../context";

export interface BaseModule {
    name? : string;
    description : string;
    execute: (ctx: Context, args: Args) => Awaitable<void>;
}

export interface PluggedModule<T extends Module> {
    mod : T;
    plugins : SernPlugin[];
}

export function commmand ( plug : CommandPlugin ) { 
    return plug;
}

export function event( plug : EventPlugin ) {
    return plug;
}

export function apply(...plugins: SernPlugin[]) {
    return plugins;
}

export function sernModule<T extends Module>
    (plugins : () => SernPlugin[], mod : T, ) : PluggedModule<T> { 
        return {
            mod,
            plugins : plugins()
        }
}
