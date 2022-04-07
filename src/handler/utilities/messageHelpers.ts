import type { Message } from 'discord.js';

/**
 * Checks if the message sent in DMs.
 * @param message The message object
 * @returns `true` if message comes from DM, `false` otherwise
 * @example isNotFromDM(message) ? 'Not From DM' : 'from DM'
 *
 */

export function isFromDM(message: Message): boolean {
  return message.channel.type == 'DM';
}

/**
 * Checks if the author of message is a bot or not
 * @param message The message to check
 * @returns `true` if the author of the message is a bot, `false` otherwise
 * @example
 * isFromBot(message) ? 'Sent by a bot' : 'Sent by a person'';
 */

export function isFromBot(message: Message): boolean {
  return !!message.author.bot;
}

/**
 * Checks if the message starts with the prefix
 * @param message The message to check
 * @param prefix The prefix to check for
 * @returns `true` if the message starts with the prefix, `false` otherwise
 * @example
 * hasPrefix(message, '!') ? 'Starts with prefix' : 'Not starts with prefix';
 */

export function hasPrefix(message: Message, prefix?: string): boolean {
  return message.content.startsWith(prefix!);
}

/**
 * Removes the first character(s) _-depending on prefix length-_ of the message
 * @param msg The message to remove the prefix from
 * @param prefix The prefix to remove
 * @returns The message without the prefix
 * @example
 * message.content = '!ping';
 * console.log(fmt(message, '!'));
 * // [ 'ping' ]
 */

export function fmt({ msg, prefix }: { msg: Message; prefix: string; }): string[] {
  return msg.content.slice(prefix.length).trim().split(/\s+/g);
}
