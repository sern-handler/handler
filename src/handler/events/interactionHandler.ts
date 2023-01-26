import type { Interaction } from 'discord.js';
import { catchError, concatMap, finalize, fromEvent, map, Observable } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import { EventsHandler } from './eventsHandler';
import { CommandType, SernError, type ModuleStore } from '../structures';
import { match, P } from 'ts-pattern';
import { contextArgs, interactionArg, dispatchAutocomplete, dispatchCommand } from './dispatchers';
import { executeModule, makeModuleExecutor } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { handleError } from '../contracts/errorHandling';
import SernEmitter from '../sernEmitter';
import type { Processed } from '../../types/handler';
import { useContainerRaw } from '../dependencies';

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
                map(this.createDispatcher),
                makeModuleExecutor(module => {
                    this.emitter.emit(
                        'module.activate',
                        SernEmitter.failure(module, SernError.PluginFailure),
                    );
                }),
                concatMap(payload => executeModule(this.emitter, payload)),
                catchError(handleError(this.crashHandler, this.logger)),
                finalize(() => {
                    this.logger?.info({ message: 'interactionCreate stream closed or reached end of lifetime'});
                    useContainerRaw()
                        ?.disposeAll()
                        .then(() => {
                            this.logger?.info({ message: 'Cleaning container and crashing' });
                        });
                })
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

    protected createDispatcher({
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
}
