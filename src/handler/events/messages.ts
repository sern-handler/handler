import { catchError, concatMap, EMPTY, finalize } from 'rxjs';
import { SernError } from '../../core/structures/errors';
import type { Message } from 'discord.js';
import { executeModule, ignoreNonBot, makeModuleExecutor } from './observableHandling';
import { ErrorHandling, handleError } from '../../core/contracts/errorHandling';
import type { Logging, ModuleManager } from '../../core/contracts';
import type { EventEmitter } from 'node:events';
import { SernEmitter, useContainerRaw } from '../../core';
import { sharedObservable } from '../../core/operators';
import { createMessageHandler } from './generic';

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

export function makeMessageCreate(
    [s, err, log, modules, client]: [
        SernEmitter,
        ErrorHandling,
        Logging | undefined,
        ModuleManager,
        EventEmitter,
    ],
    defaultPrefix: string | undefined,
) {
    if (!defaultPrefix) {
        log?.debug({ message: 'No prefix found. message handler shut down' });
        return EMPTY.subscribe();
    }
    const messageStream$ = sharedObservable<Message>(client, 'messageCreate');
    const handler = createMessageHandler(messageStream$, defaultPrefix, modules);
    const messageHandler = handler(ignoreNonBot(defaultPrefix) as (m: Message) => m is Message);
    return messageHandler.pipe(
        makeModuleExecutor(module => {
            s.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
        }),
        concatMap(payload => executeModule(s, payload)),
        catchError(handleError(err, log)),
        finalize(() => {
            log?.info({ message: 'messageCreate stream closed or reached end of lifetime' });
            useContainerRaw()
                ?.disposeAll()
                .then(() => log?.info({ message: 'Cleaning container and crashing' }));
        }),
    );
}
