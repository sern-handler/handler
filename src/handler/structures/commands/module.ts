import type { ApplicationCommandOptionData, Awaitable } from "discord.js";
import type { possibleOutput } from "../../../types/handler";
import type { CommandType } from "../../sern";



interface BaseModule {
    name? : string;
    description : string;
    execute() : Awaitable<possibleOutput | void>
    plugins? : [] //TODO
}

type TextCommand = { moduleType : CommandType.TEXT; alias : string[] | [] };
type SlashCommand = { moduleType : CommandType.SLASH; options : ApplicationCommandOptionData[] | [] };
type BothCommand = { moduleType : CommandType.BOTH; alias : string[] | []; options : ApplicationCommandOptionData[] | [] }

export type Module = 
    BaseModule & (
    TextCommand
    | SlashCommand
    | BothCommand
    );









