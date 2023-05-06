import { catchError, concatMap, EMPTY, finalize, map, pipe } from 'rxjs';
import { SernError } from '../../core/structures/errors';
import type { Message } from 'discord.js';
import { executeModule, ignoreNonBot, makeModuleExecutor } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { ErrorHandling, handleError } from '../../core/contracts/errorHandling';
import { contextArgs, dispatchCommand } from './dispatchers';
import type { Processed } from '../../types/core';
import { useContainerRaw } from '../../core/dependencies';
import type { Logging, ModuleManager } from '../../core/contracts';
import type { EventEmitter } from 'node:events';
import { WebsocketStrategy, SernEmitter } from '../../core';
import { err } from '../../core/functions';
import { defaultModuleLoader } from '../../core/module-loading';
import { sharedObservable, filterMap } from '../../core/operators';
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
    platform: WebsocketStrategy
) {
    if(!platform.defaultPrefix) {
        return EMPTY.subscribe()
    }
    const messageStream$ = sharedObservable<Message>(client, platform.eventNames[1]);
    const handler = createMessageHandler(messageStream$, platform.defaultPrefix, modules);
    const messageHandler = handler(
        ignoreNonBot(platform.defaultPrefix) as (m: Message) => m is Message
    )
    return messageHandler 
        .pipe(
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
        )
}
