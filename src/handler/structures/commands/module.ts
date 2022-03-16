import type { ApplicationCommandOptionData, Awaitable, PartialWebhookMixin } from "discord.js";
import type { possibleOutput } from "../../../types/handler";
import type { CommandType } from "../../sern";



export interface BaseModule {
    name? : string;
    description : string;
    execute() : Awaitable<possibleOutput | void>
}

export type Text = { type : CommandType.TEXT; alias : string[] | [] };
export type Slash = { type : CommandType.SLASH; options : ApplicationCommandOptionData[] | [] };
export type Both = { type : CommandType.BOTH; alias : string[] | []; options : ApplicationCommandOptionData[] | [] }

export type Module = 
    (BaseModule & Slash) | (BaseModule & Both) | (BaseModule & Text);
    








