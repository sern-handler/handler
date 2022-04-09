import type { Awaitable, ChatInputCommandInteraction, Interaction } from "discord.js";
import type { Args, Module } from "../../..";
import type Context from "../context";

export interface BaseModule {
    name? : string;
    description : string;
    execute: (ctx: Context, args: Args) => Awaitable<void>;
}


export function sernModule<T extends Module> (module : T, plugins : Plugin[]) { 


}
