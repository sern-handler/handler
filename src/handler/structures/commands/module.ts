import type { ApplicationCommandOptionData, Awaitable } from "discord.js";
import type { parseArgs, possibleOutput } from "../../../types/handler";
import type { CommandType } from "../../sern";
import type Context from "../context";



export interface BaseModule {
    name? : string;
    description : string;
    execute(ctx: Context, args: unknown) : Awaitable<possibleOutput | void>
}
export type Text = { type : CommandType.TEXT; alias : string[] | [], parse? : parseArgs };
export type Slash = { type : CommandType.SLASH; options : ApplicationCommandOptionData[] | [], parse? : parseArgs };
export type Both = { type : CommandType.BOTH; alias : string[] | []; options : ApplicationCommandOptionData[] | [], parse? : parseArgs }

export type Module = 
    (BaseModule & Slash) | (BaseModule & Both) | (BaseModule & Text);
    
