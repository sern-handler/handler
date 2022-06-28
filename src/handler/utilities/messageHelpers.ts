import type { Message } from 'discord.js';

/**
 * Removes the first character(s) _[depending on prefix length]_ of the message
 * @param msg
 * @param prefix The prefix to remove
 * @returns The message without the prefix
 * @example
 * message.content = '!ping';
 * console.log(fmt(message, '!'));
 * // [ 'ping' ]
 */
export function fmt(msg: Message, prefix: string): string[] {
    return msg.content.slice(prefix.length).trim().split(/\s+/g);
}
