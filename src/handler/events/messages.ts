import { concatMap, EMPTY } from 'rxjs';
import { SernError } from '../../core/structures/errors';
import type { Message } from 'discord.js';
import { SernEmitter } from '../../core';
import { sharedEventStream } from '../../core/operators';
import { createMessageHandler, executeModule, isNonBot, makeModuleExecutor } from './generic';
import { DependencyList } from '../types';

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

export function messageHandler(
    [emitter, , log, modules, client]: DependencyList,
    defaultPrefix: string | undefined,
) {
    if (!defaultPrefix) {
        log?.debug({ message: 'No prefix found. message handler shutting down' });
        return EMPTY;
    }
    const messageStream$ = sharedEventStream<Message>(client, 'messageCreate');
    const handle = createMessageHandler(messageStream$, defaultPrefix, modules);

    const msgCommands$ = handle(isNonBot(defaultPrefix));

    return msgCommands$.pipe(
        makeModuleExecutor(module => {
            emitter.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
        }),
        concatMap(payload => executeModule(emitter, payload)),
    );
}
