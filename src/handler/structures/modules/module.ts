import type { Awaitable, ChatInputCommandInteraction, Interaction } from "discord.js";
import type { Args } from "../../..";
import type Context from "../context";

export interface BaseModule {
    name? : string;
    description : string;
    execute: (ctx: Context, args: Args) => Awaitable<void>;
}




