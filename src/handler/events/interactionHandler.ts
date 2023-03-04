import type { Interaction } from 'discord.js';
import { catchError, concatMap, EMPTY, filter, finalize, fromEvent, map, Observable, of, OperatorFunction, pipe } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import { EventsHandler } from './eventsHandler';
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


function makeInteractionProcessor(modules: ModuleManager): OperatorFunction<Interaction, { module: Processed<CommandModule>; event: Interaction }>  {
    const get = (cb: (ms: ModuleStore) => Processed<CommandModule> | undefined) => {
          return modules.get(cb);
    };
    return pipe(
        concatMap(event => {
         if (event.isMessageComponent()) {
             const module = get(ms =>
               ms.InteractionHandlers[event.componentType].get(event.customId),
             );
           return of({module, event})
         } else if (event.isCommand() || event.isAutocomplete()) {
           const module = get(ms =>
              /**
                * try to fetch from ApplicationCommands, if nothing, try BothCommands
                * exists on the API but not sern
                */
                ms.ApplicationCommands[event.commandType].get(event.commandName) ??
                ms.BothCommands.get(event.commandName),
         );
          return of({ module, event })
       } else if (event.isModalSubmit()) {
          const module = get(ms => ms.ModalSubmit.get(event.customId));
          return of({ module, event })
       }
         else return EMPTY
    }),
    filter(m => m.module !== undefined)
    );
}

export function makeInteractionCreate(
    [s, client, err, log, modules]: [SernEmitter, EventEmitter, ErrorHandling, Logging | undefined, ModuleManager]
) {

    map. If nothing again,this means a slash command
    const interactionStream$ = fromEvent(client, 'interactionCreate');
    const interactionProcessor = makeInteractionProcessor(modules);
    return interactionStream$.pipe(
        interactionProcessor,
        map(createDispatcher),
        makeModuleExecutor(module => {
            s.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure))
        }),
        concatMap(module => executeModule(s, module)),
        catchError(handleError(err, log)),
        finalize(() => {
            this.logger?.info({ message: 'interactionCreate stream closed or reached end of lifetime' });
            useContainerRaw()
                ?.disposeAll()
               .then(() => log?.info({ message: 'Cleaning container and crashing' }));
        })
    ).subscribe();

}
export default class InteractionHandler extends EventsHandler<{
    event: Interaction;
    module: Processed<CommandModule>;
}> {
    protected override discordEvent: Observable<Interaction>;

    constructor(wrapper: Wrapper) {
        super(wrapper);
        this.discordEvent = <Observable<Interaction>>fromEvent(this.client, 'interactionCreate');
        this.init();

        this.payloadSubject
            .pipe(
                map(createDispatcher),
                makeModuleExecutor(module => {
                    this.emitter.emit(
                        'module.activate',
                        SernEmitter.failure(module, SernError.PluginFailure),
                    );
                }),
                concatMap(payload => executeModule(this.emitter, payload)),
                catchError(handleError(this.crashHandler, this.logger)),
                finalize(() => {
                    this.logger?.info({ message: 'interactionCreate stream closed or reached end of lifetime' });
                    useContainerRaw()
                        ?.disposeAll()
                        .then(() => {
                            this.logger?.info({ message: 'Cleaning container and crashing' });
                        });
                }),
            )
            .subscribe();
    }

    override init() {
        const get = (cb: (ms: ModuleStore) => Processed<CommandModule> | undefined) => {
            return this.modules.get(cb);
        };
        /**
         * Module retrieval:
         * ModuleStores are mapped by Discord API values and modules mapped
         * by customId or command name.
         */
        this.discordEvent.subscribe({
            next: event => {
                if (event.isMessageComponent()) {
                    const module = get(ms =>
                        ms.InteractionHandlers[event.componentType].get(event.customId),
                    );
                    this.setState({ event, module });
                } else if (event.isCommand() || event.isAutocomplete()) {
                    const module = get(
                        ms =>
                            /**
                             * try to fetch from ApplicationCommands, if nothing, try BothCommands
                             * map. If nothing again,this means a slash command
                             * exists on the API but not sern
                             */
                            ms.ApplicationCommands[event.commandType].get(event.commandName) ??
                            ms.BothCommands.get(event.commandName),
                    );
                    this.setState({ event, module });
                } else if (event.isModalSubmit()) {
                    const module = get(ms => ms.ModalSubmit.get(event.customId));
                    this.setState({ event, module });
                } else {
                    throw Error('This interaction is not supported yet');
                }
            },
            error: reason => {
                this.emitter.emit('error', SernEmitter.failure(undefined, reason));
            },
        });
    }

    protected setState(state: { event: Interaction; module: CommandModule | undefined }): void {
        if (state.module === undefined) {
            this.emitter.emit(
                'warning',
                SernEmitter.warning('Found no module for this interaction'),
            );
        } else {
            //if statement above checks already, safe cast
            this.payloadSubject.next(
                state as { event: Interaction; module: Processed<CommandModule> },
            );
        }
    }
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
                .with({ type: CommandType.Text }, () =>
                    this.crashHandler.crash(Error(SernError.MismatchEvent)),
                )
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

