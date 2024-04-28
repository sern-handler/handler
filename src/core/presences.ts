import type { ActivitiesOptions } from "discord.js";
import type { IntoDependencies } from "../types/ioc";
import type { Emitter } from "./contracts/emitter";

type Status = 'online' | 'idle' | 'invisible' | 'dnd'
type PresenceReduce = (previous: Result) => Result;

export interface Result { 
    status?: Status;
    afk?: boolean;
    activities?: ActivitiesOptions[];
    shardId?: number[];
    repeat?: number | [Emitter, string];
    onRepeat?: (previous: Result) => Result; 
}

export type Config <T extends (keyof Dependencies)[]> = 
{
    inject?: [...T]
    execute: (...v: IntoDependencies<T>) => Result;
};

/**
  * A small wrapper to provide type inference.
  * Create a Presence module which **MUST** be put in a file called presence.(language-extension)
  * adjacent to the file where **Sern.init** is CALLED.
  */
export const module = <T extends (keyof Dependencies)[]>(conf: Config<T>) => conf;


/**
  * Create a Presence body which can be either: 
  * - once, the presence is activated only once.
  * - repeated, per cycle or event, the presence can be changed.
  */
export function of(root: Omit<Result, 'repeat' | 'onRepeat'>) {
    return { 
        /**
         * @example
         * Presence
         *     .of({ 
         *          activities: [{ name: "deez nuts" }] 
         *     }) //starts the presence with "deez nuts".
         *     .repeated(prev => { 
         *         return {
         *             afk: true,
         *             activities: prev.activities?.map(s => ({ ...s, name: s.name+"s" }))
         *         };
         *     }, 10000)) //every 10 s, the callback sets the presence to the returned one.
         */
        repeated: (onRepeat: PresenceReduce, repeat: number | [Emitter, string]) => {
            return { repeat, onRepeat, ...root }
        },
        /**
         * @example
         * Presence
         *     .of({
         *        activities: [
         *          { name: "Chilling out" }
         *        ]
         *      })
         *     .once() // Sets the presence once, with what's provided in '.of()'
         */
        once: () => root
    };
}

