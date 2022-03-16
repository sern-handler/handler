import { ChannelType, Message } from 'discord.js';

/**
 * @param message The message object
 * @returns `true` if message comes from DM, `false` otherwise
 * @example isNotFromDM(message) ? 'Not From DM' : 'from DM'
 *
 */

export function isNotFromDM ( message: Message ) { 
   return message.channel.type !== ChannelType.DM;
}

/**
 * Checks if the author of message is a bot or not
 * @param message The message to check
 * @returns `true` if the author of the message is a bot, `false` otherwise
 * @example
 * isBot(message) ? 'yes it is a bot' : 'no it is not a bot';
 */
export function isNotFromBot(message: Message) {
    return !message.author.bot;
}
/**
 * Checks if the message **starts** with the prefix
 * @param message The message to check
 * @param prefix The prefix to check for
 * @returns `true` if the message starts with the prefix, `false` otherwise
 * @example
 * hasPrefix(message, '!') ? 'yes it does' : 'no it does not';
 */
export function hasPrefix(message: Message, prefix?: string) {
    return message.content.startsWith(prefix!);
}
/**
 * Removes the first character(s) _[depending on prefix length]_ of the message
 * @param message The message to remove the prefix from
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
