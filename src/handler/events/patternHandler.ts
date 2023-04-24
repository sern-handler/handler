import { EMPTY, Observable, catchError, concatMap, finalize, fromEvent, map, of, pipe } from 'rxjs';
import { Processed } from '../../types/handler';
import { CommandModule, PatternCommand } from '../../types/module';
import { ModuleStore, SernError } from '../structures';
import { dispatchCommand, patternArgs } from './dispatchers';
import { executeModule, ignoreNonBot, makeModuleExecutor } from './observableHandling';
import EventEmitter from 'events';
import { ErrorHandling, Logging, ModuleManager } from '../contracts';
import SernEmitter from '../sernEmitter';
import { Message } from 'discord.js';
import { handleError } from '../contracts/errorHandling';
import { useContainerRaw } from '../dependencies';

const createMessageProcessor = (
    regex: RegExp,
    get: (
        cb: (ms: ModuleStore) => Processed<CommandModule> | undefined,
    ) => CommandModule | undefined,
) =>
    pipe(
        ignoreNonBot(regex),
        concatMap(message => {
            // make two variables, one for text matching regex, one for rest of words
            const [text, ...rest] = message.content.split(regex);
            const module = get(ms => ms.PatternCommands.get(text));
            if (module === undefined) {
                return EMPTY;
            }
            const payload = {
                args: patternArgs(message, rest),
                module,
            };
            return of(payload);
        }),
        map(({ args, module }) => dispatchCommand(module as Processed<PatternCommand>, args)),
    );

export function patternMessageCreate(
    [s, client, err, log, modules]: [
        SernEmitter,
        EventEmitter,
        ErrorHandling,
        Logging | undefined,
        ModuleManager,
    ],
    regex?: RegExp,
) {
    if (!regex) {
        return EMPTY.subscribe();
    }
    const get = (cb: (ms: ModuleStore) => Processed<CommandModule> | undefined) => modules.get(cb);
	const messageStream$ = fromEvent(client, 'messageCreate') as Observable<Message>;
    const messageProcessor = createMessageProcessor(regex, get);

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
