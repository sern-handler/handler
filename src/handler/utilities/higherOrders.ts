import type { Message } from 'discord.js';

type MsgFnArgs = [msgOrInter: Message, prefix?: string];
type MsgFn = (...args: MsgFnArgs) => boolean;

/**
 * 
 * @param {MsgFn} fn any function that has argument `MsgFnArgs` returning boolean 
 * @returns {(message: Message, prefix: string) => boolean}
 */
export function AllTrue(...fns: MsgFn[]):
    (message: Message, prefix: string) => boolean {
    return (message: Message, prefix: string) => {
        return fns.every(g => g(message, prefix));
    };
}