import type { Message } from 'discord.js';
/**
 * Checks if the author of message is a bot or not
 * ```typescript
 * isBot(message) ? 'yes it is a bot' : 'no it is not a bot';
 * ```
 */
export function isBot(message: Message) {
    return message.author.bot;
}
/**
 * Checks if the message **starts** with the prefix
 * ```typescript
 * hasPrefix(message, '!') ? 'yes it does' : 'no it does not';
 * ```
 */
export function hasPrefix(message: Message, prefix: string) {
    return message.content.slice(0, prefix.length).toLowerCase().trim() === prefix;
}
/**
 * Removes the first character(s) _[depending on prefix length]_ of the message
 * ```typescript
 * message.content = '!ping';
 * console.log(fmt(message, '!'));
 * // [ 'ping' ]
 * ```
 */
export function fmt(msg: Message, prefix: string): string[] {
    return msg.content.slice(prefix.length).trim().split(/\s+/g);
}
