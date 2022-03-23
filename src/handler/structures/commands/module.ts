import type { ApplicationCommandOptionData, Awaitable, Interaction } from "discord.js";
import type { Args } from "../../../types/handler";
import type { CommandType } from "../../sern";
import type Context from "../context";



export interface BaseModule {
    name? : string;
    description : string;
    execute: (ctx: Context<Interaction>, args: Args) => Awaitable<void>;
}
export type Text = {
    type : CommandType.TEXT;
    alias : string[] | [],
};
export type Slash = {
    type : CommandType.SLASH;
    options : ApplicationCommandOptionData[] | [],
};

export type Both = {
    type : CommandType.BOTH; 
    alias : string[] | [];
    options : ApplicationCommandOptionData[] | [],
}

export type Module = 
    (BaseModule & Slash) | (BaseModule & Both) | (BaseModule & Text);
    
