import type { Interaction } from 'discord.js';
import {
    catchError,
    concatMap,
    EMPTY,
    filter,
    finalize,
    fromEvent,
    map,
    Observable,
    of,
    OperatorFunction,
    pipe,
} from 'rxjs';
import { CommandType, type ModuleStore, SernError } from '../structures';
import { match, P } from 'ts-pattern';
import { contextArgs, dispatchAutocomplete, dispatchCommand, interactionArg } from './dispatchers';
import { executeModule, makeModuleExecutor } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { ErrorHandling, handleError } from '../contracts/errorHandling';
import SernEmitter from '../sernEmitter';
import type { Processed } from '../../types/handler';
import { useContainerRaw } from '../dependencies';
import type { Logging, ModuleManager } from '../contracts';
import type { EventEmitter } from 'node:events';

function makeInteractionProcessor(
    modules: ModuleManager,
): OperatorFunction<Interaction, { module: Processed<CommandModule>; event: Interaction }> {
    const get = (cb: (ms: ModuleStore) => Processed<CommandModule> | undefined) => {
        return modules.get(cb);
    };
    return pipe(
        concatMap(event => {
            if (event.isMessageComponent()) {
                const module = get(ms =>
                    ms.InteractionHandlers[event.componentType].get(event.customId),
                );
                return of({ module, event });
            } else if (event.isCommand() || event.isAutocomplete()) {
                const module = get(
                    ms =>
                        /**
                         * try to fetch from ApplicationCommands, if nothing, try BothCommands
                         * exists on the API but not sern
                         */
                        ms.ApplicationCommands[event.commandType].get(event.commandName) ??
                        ms.BothCommands.get(event.commandName),
                );
                return of({ module, event });
            } else if (event.isModalSubmit()) {
                const module = get(ms => ms.ModalSubmit.get(event.customId));
                return of({ module, event });
            } else return EMPTY;
        }),
        filter(m => m.module !== undefined),
    ) as OperatorFunction<Interaction, { module: Processed<CommandModule>; event: Interaction }>;
}

export function makeInteractionCreate([s, client, err, log, modules]: [
    SernEmitter,
    EventEmitter,
    ErrorHandling,
    Logging | undefined,
    ModuleManager,
]) {
    //map. If nothing again,this means a slash command
    const interactionStream$ = fromEvent(client, 'interactionCreate') as Observable<Interaction>;
    const interactionProcessor = makeInteractionProcessor(modules);
    return interactionStream$
        .pipe(
            interactionProcessor,
            map(createDispatcher),
            makeModuleExecutor(module => {
                s.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
            }),
            concatMap(module => executeModule(s, module)),
            catchError(handleError(err, log)),
            finalize(() => {
                log?.info({
                    message: 'interactionCreate stream closed or reached end of lifetime',
                });
                useContainerRaw()
                    ?.disposeAll()
                    .then(() => log?.info({ message: 'Cleaning container and crashing' }));
            }),
        )
        .subscribe();
}

function createDispatcher({
    module,
    event,
}: {
    event: Interaction;
    module: Processed<CommandModule>;
}) {
    return (
        match(module)
            .with({ type: CommandType.Text }, () => {
                throw Error(SernError.MismatchEvent);
            })
            //P.union = either CommandType.Slash or CommandType.Both
            .with({ type: P.union(CommandType.Slash, CommandType.Both) }, module => {
                if (event.isAutocomplete()) {
                    /**
                     * Autocomplete is a special case that
                     * must be handled separately, since it's
                     * too different from regular command modules
                     */
                    return dispatchAutocomplete(module, event);
                } else {
                    return dispatchCommand(module, contextArgs(event));
                }
            })
            /**
             * Every other command module takes a one argument parameter, its corresponding interaction
             * this makes this usage safe
             */
            .otherwise(mod => dispatchCommand(mod, interactionArg(event)))
    );
}
