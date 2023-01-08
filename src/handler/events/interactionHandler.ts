import type { Interaction } from 'discord.js';
import { catchError, concatMap, from, fromEvent, map, Observable } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import { EventsHandler } from './eventsHandler';
import { SernError } from '../structures/errors';
import { CommandType, PayloadType } from '../structures/enums';
import { match, P } from 'ts-pattern';
import {
    interactionArg,
    contextArgs,
    commandDispatcher,
    dispatchAutocomplete, dispatcher,
} from './dispatchers';
import { executeModule } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { handleError } from '../contracts/errorHandling';
import type { ModuleStore } from '../structures/moduleStore';

export default class InteractionHandler extends EventsHandler<{
    event: Interaction;
    module: CommandModule;
}> {
    protected override discordEvent: Observable<Interaction>;
    constructor(wrapper: Wrapper) {
        super(wrapper);
        this.discordEvent = <Observable<Interaction>>fromEvent(this.client, 'interactionCreate');
        this.init();

        this.payloadSubject
            .pipe(
                map(this.processModules),
                concatMap(
                    ({ module, execute, controlResult }) =>
                        from(controlResult()).pipe(map(res => ({ module, res, execute }))), //resolve all the Results from event plugins
                ),
                concatMap(payload => executeModule(wrapper, payload)),
                catchError(handleError(this.crashHandler, this.logger)),
            )
            .subscribe();
    }

    override init() {
        const get = (cb: (ms: ModuleStore) => CommandModule | undefined) => {
            return this.modules.get(cb);
        };
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
                this.emitter.emit('error', { type: PayloadType.Failure, reason });
            },
        });
    }

    protected setState(state: { event: Interaction; module: CommandModule | undefined }): void {
        if (state.module === undefined) {
            this.emitter.emit('warning', {
                type: PayloadType.Warning,
                reason: 'Found no module for this interaction',
            });
        } else {
            //if statement above checks already, safe cast
            this.payloadSubject.next(state as { event: Interaction; module: CommandModule });
        }
    }

    protected processModules({ module, event }: { event: Interaction; module: CommandModule }) {
        return match(module)
            .with({ type: P.union(CommandType.Slash, CommandType.Both) }, module => {
                if(event.isAutocomplete()) {
                    /**
                     * Autocomplete is a special case that
                     * must be handled separately, since it's
                     * too different from regular command modules
                     */
                    return dispatchAutocomplete(module, event);
                } else {
                    return commandDispatcher(module, contextArgs(event));
                }
            })
            .with({ type: CommandType.Text }, () => this.crashHandler.crash(Error(SernError.MismatchEvent)))
            /**
             * Every other command module takes a one argument parameter, its corresponding interaction
             * this makes this usage safe
             */
            .otherwise((mod) => dispatcher(mod, interactionArg(event)));
    }
}
