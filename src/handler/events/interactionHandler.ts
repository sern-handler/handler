import type { Interaction } from 'discord.js';
import { catchError, concatMap, from, fromEvent, map, Observable } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import { EventsHandler } from './eventsHandler';
import { SernError } from '../structures/errors';
import { CommandType, PayloadType } from '../structures/enums';
import { match, P } from 'ts-pattern';
import {
    applicationCommandDispatcher,
    buttonCommandDispatcher,
    ctxMenuMsgDispatcher,
    ctxMenuUserDispatcher,
    modalCommandDispatcher,
    selectMenuCommandDispatcher,
} from './dispatchers';
import type {
    ButtonInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { executeModule } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { handleError } from '../contracts/errorHandling';
import type { ModuleStore } from '../structures/moduleStore';
import type { MessageComponentInteraction } from 'discord.js';

export default class InteractionHandler extends EventsHandler<{
    event: Interaction;
    mod: CommandModule;
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
                    ({ mod, execute, eventPluginRes }) =>
                        from(eventPluginRes).pipe(map(res => ({ mod, res, execute }))), //resolve all the Results from event plugins
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
                    const mod = get(ms =>
                        ms.InteractionHandlers[event.componentType].get(event.customId),
                    );
                    this.setState({ event, mod });
                } else if (event.isCommand() || event.isAutocomplete()) {
                    const mod = get(
                        ms =>
                            ms.ApplicationCommands[event.commandType].get(event.commandName) ??
                            ms.BothCommands.get(event.commandName),
                    );
                    this.setState({ event, mod });
                } else if (event.isModalSubmit()) {
                    const mod = get(ms => ms.ModalSubmit.get(event.customId));
                    this.setState({ event, mod });
                } else {
                    throw Error('This interaction is not supported yet');
                }
            },
            error: reason => {
                this.emitter.emit('error', { type: PayloadType.Failure, reason });
            },
        });
    }

    protected setState(state: { event: Interaction; mod: CommandModule | undefined }): void {
        if (state.mod === undefined) {
            this.emitter.emit('warning', {
                type: PayloadType.Warning,
                reason: 'Found no module for this interaction',
            });
        } else {
            //if statement above checks already, safe cast
            this.payloadSubject.next(state as { event: Interaction; mod: CommandModule });
        }
    }

    protected processModules({ mod, event }: { event: Interaction; mod: CommandModule }) {
        return match(mod)
            .with(
                { type: P.union(CommandType.Slash, CommandType.Both) },
                applicationCommandDispatcher(event),
            )
            .with(
                { type: CommandType.Modal },
                modalCommandDispatcher(event as ModalSubmitInteraction),
            )
            .with({ type: CommandType.Button }, buttonCommandDispatcher(event as ButtonInteraction))
            .with(
                {
                    type: P.union(
                        CommandType.RoleSelect,
                        CommandType.StringSelect,
                        CommandType.UserSelect,
                        CommandType.MentionableSelect,
                        CommandType.ChannelSelect,
                    ),
                },
                selectMenuCommandDispatcher(event as MessageComponentInteraction),
            )
            .with(
                { type: CommandType.CtxUser },
                ctxMenuUserDispatcher(event as UserContextMenuCommandInteraction),
            )
            .with(
                { type: CommandType.CtxMsg },
                ctxMenuMsgDispatcher(event as MessageContextMenuCommandInteraction),
            )
            .otherwise(() => this.crashHandler.crash(Error(SernError.MismatchModule)));
    }
}
