import { catchError, concatMap, EMPTY, finalize, fromEvent, map, of, pipe } from 'rxjs';
import { type ModuleStore, SernError } from '../structures';
import type { Message } from 'discord.js';
import { executeModule, ignoreNonBot, makeModuleExecutor } from './observableHandling';
import { fmt } from '../utilities/messageHelpers';
import type { CommandModule, TextCommand } from '../../types/module';
import { ErrorHandling, handleError } from '../contracts/errorHandling';
import { contextArgs, dispatchCommand } from './dispatchers';
import SernEmitter from '../sernEmitter';
import type { Processed } from '../../types/handler';
import { useContainerRaw } from '../dependencies';
import type { Logging, ModuleManager } from '../contracts';
import type { EventEmitter } from 'node:events';

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
            const moule = get(ms => ms.TextCommands.get(prefix) ?? ms.BothCommands.get(prefix));
            if (module === undefined) {
                return EMPTY;
            }
            const payload = {
                args: contextArgs(message, rest),
                module,
            };
            return of(payload);
        }),
        map(({ args, module }) => dispatchCommand(module as Processed<TextCommand>, args)),
    );

export function makeMessageCreate(
    [s, client, err, log, modules]: [
        SernEmitter,
        EventEmitter,
        ErrorHandling,
        Logging | undefined,
        ModuleManager,
    ],
    defaultPrefix?: string,
) {
    if (!defaultPrefix) {
        return EMPTY.subscribe();
    }
    const get = (cb: (ms: ModuleStore) => Processed<CommandModule> | undefined) => {
        return modules.get(cb);
    };
    const messageStream$ = fromEvent<Message>(client, 'messageCreate');
    const messageProcessor = createMessageProcessor(defaultPrefix, get);
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
