import type { ActivitiesOptions } from "discord.js";
import type { IntoDependencies } from "../types/ioc";
import type { Emitter } from "./interfaces";

type Status = 'online' | 'idle' | 'invisible' | 'dnd'
type PresenceReduce = (previous: PresenceResult) => PresenceResult;

export interface PresenceResult { 
    status?: Status;
    afk?: boolean;
    activities?: ActivitiesOptions[];
    shardId?: number[];
    repeat?: number | [Emitter, string];
    onRepeat?: (previous: PresenceResult) => PresenceResult; 
}

export const Presence = {
    /**
     * A small wrapper to provide type inference.
     * Create a Presence module which **MUST** be put in a file called presence.(language-extension)
     * adjacent to the file where **Sern.init** is CALLED.
     */
    module : <T extends (keyof Dependencies)[]>(conf: PresenceConfig<T>) => conf,
    /**
     * Create a Presence body which can be either: 
     * - once, the presence is activated only once.
     * - repeated, per cycle or event, the presence can be changed.
     */
    of : (root: Omit<PresenceResult, 'repeat' | 'onRepeat'>) => {
        return { 
            /**
             * @example
             * Presence
             *     .of({ activities: [{ name: "deez nuts" }] }) //starts presence with "deez nuts".
             *     .repeated(prev => { 
             *         return {
             *             afk: true,
             *             activities: prev.activities?.map(s => ({ ...s, name: s.name+"s" }))
             *         };
             *     }, 10000)) //every 10 s, the callback sets the presence to the value returned.
             */
            repeated: (onRepeat: PresenceReduce, repeat: number | [Emitter, string]) => {
                return { repeat, onRepeat, ...root }
            },
            /**
             * @example
             * ```ts
             * Presence.of({
             *          activities: [
             *              { name: "Chilling out" }
             *          ]
             *      }).once() // Sets the presence once, with what's provided in '.of()'
             *  ```
             */
            once: () => root
        };
    }
}

export type PresenceConfig <T extends (keyof Dependencies)[]> = {
    inject?: [...T]
    execute: (...v: IntoDependencies<T>) => PresenceResult;
    
};
