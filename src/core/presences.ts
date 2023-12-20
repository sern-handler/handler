import { ActivitiesOptions } from "discord.js";
import { IntoDependencies } from "../types/ioc";

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
            create: | number //interval
            onInterval: (previous: Result) => Once 
        }
      }
    | Once;
