import type { Message } from 'discord.js';

type MsgFnArgs = [msgOrInter: Message, prefix?: string];
type MsgFn = (...args: MsgFnArgs) => boolean;

/**
 * 
 * @param {MsgFn} fn any function that has argument `MsgFnArgs` returning boolean 
 * @returns {(message: Message, prefix: string) => boolean}
 */
export function AllTrue(...fn : MsgFn[]) :
 (message: Message, prefix: string) => boolean {
    return (message: Message, prefix: string) => {
        return fn.every(f => f(message, prefix) === true);
    };
}

