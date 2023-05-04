import { catchError, concatMap, EMPTY, finalize, fromEvent, map, Observable, of, pipe } from 'rxjs';
import { type ModuleStore, SernError } from '../../core/structures';
import type { Message } from 'discord.js';
import { executeModule, ignoreNonBot, makeModuleExecutor } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { ErrorHandling, handleError } from '../../core/contracts/errorHandling';
import { contextArgs, dispatchCommand } from './dispatchers';
import SernEmitter from '../../core/sernEmitter';
import type { Processed } from '../../types/handler';
import { useContainerRaw } from '../../core/dependencies';
import type { Logging, ModuleManager } from '../../core/contracts';
import type { EventEmitter } from 'node:events';
import { WebsocketStrategy } from '../../core';
import { createModuleGetter } from '../../core/contracts/moduleManager';

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

/**
 * An operator function that processes a message to fetch a command module and prepares context payload.
 * @param defaultPrefix
 * @param get
 */
const createMessageProcessor = (
    defaultPrefix: string,
    get: (
        cb: (ms: ModuleStore) => Processed<CommandModule> | undefined,
    ) => CommandModule | undefined,
) =>
    pipe(
        ignoreNonBot(defaultPrefix),
        //This concatMap checks if module is undefined, and if it is, do not continue.
        // Synonymous to filterMap, but I haven't thought of a generic implementation for filterMap yet
        concatMap(message => {
            const [prefix, ...rest] = fmt(message.content, defaultPrefix);
            const module = get(ms => ms.TextCommands.get(prefix) ?? ms.BothCommands.get(prefix));
            if (module === undefined) {
                return EMPTY;
            }
            const payload = {
                args: contextArgs(message, rest),
                module,
            };
            return of(payload);
        }),
        map(({ args, module }) => dispatchCommand(module as Processed<CommandModule>, args)),
    );

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
    const get = createModuleGetter(modules); 
    const messageStream$ = fromEvent(client, platform.eventNames[1]) as Observable<Message>;
    const messageProcessor = createMessageProcessor(platform.defaultPrefix, get);
    return messageStream$
        .pipe(
            messageProcessor,
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
        .subscribe();
}
