import type { Message } from 'discord.js';
import type { OptionData } from '../../types/options';

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

/**
 * A HoF that acts as a ligtweight slash command options builder, enabling user with intellisense
 * @param { T extends keyof OptionData } type type of option
 * @returns { (optionData: Omit<OptionData[T], 'type'>) => ApplicationCommandOptionData | Omit<OptionData[T], 'type'> } creates options
 */
export function Option<T extends keyof OptionData>(type: T) {
    return (optionData: Omit<OptionData[T], 'type'>) => { return { type, ...optionData }; };
}