
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
export function fmt(msg: string, prefix: string): string[] {
    return msg.slice(prefix.length).trim().split(/\s+/g);
}
