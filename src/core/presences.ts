import type { ActivitiesOptions } from "discord.js";
import type { IntoDependencies } from "../types/ioc";
import type { Emitter } from "./contracts/emitter";

type Status = 'online' | 'idle' | 'invisible' | 'dnd'

interface Once { 
    status?: Status;
    afk?: boolean;
    activities?: ActivitiesOptions[];
    shardId?: number[];
}

export type Config <T extends (keyof Dependencies)[]> = 
{
    inject?: [...T]
    execute: (...v: IntoDependencies<T>) => Result;
};

export function create<T extends (keyof Dependencies)[]>
(conf: Config<T>) {
    return conf;
}

export type Result =
    | {
        repeated: { 
            create: | number 
                    | [Emitter, string];
            onInterval: (previous: Result) => Once 
        }
      }
    | Once;
