import type { Interaction } from 'discord.js';
import { catchError, concatMap, from, fromEvent, map, Observable, retry } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import { EventsHandler } from './eventsHandler';
import * as Files from '../utilities/readFile';
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
    SelectMenuInteraction,
    UserContextMenuCommandInteraction,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { executeModule } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { handleError } from '../contracts/errorHandling';

export default class InteractionHandler extends EventsHandler<{
    event: Interaction;
    mod: CommandModule;
}> {
    protected override discordEvent: Observable<Interaction>;

    constructor(protected wrapper: Wrapper) {
        super(wrapper);
        this.discordEvent = <Observable<Interaction>>fromEvent(this.client, 'interactionCreate');
        this.init();

        this.payloadSubject
            .pipe(
                map(this.processModules),
                concatMap(({ mod, execute, eventPluginRes }) => {
                    //resolve all the Results from event plugins
                    return from(eventPluginRes).pipe(map(res => ({ mod, res, execute })));
                }),
                concatMap(payload => executeModule(wrapper, payload)),
                catchError(handleError(this.crashHandler, this.logger)),
            )
            .subscribe();
    }

    override init() {
        this.discordEvent.subscribe({
            next: event => {
                if (event.isMessageComponent()) {
                    const mod = Files.MessageCompCommands[event.componentType].get(event.customId);
                    this.setState({ event, mod });
                } else if (event.isCommand() || event.isAutocomplete()) {
                    const mod =
                        Files.ApplicationCommands[event.commandType].get(event.commandName) ??
                        Files.BothCommands.get(event.commandName);
                    this.setState({ event, mod });
                } else if (event.isModalSubmit()) {
                    /**
                     * maybe move modal submits into message component object maps?
                     */
                    const mod = Files.ModalSubmitCommands.get(event.customId);
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
            this.emitter.emit('warning', 'Found no module for this interaction');
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
                { type: CommandType.MenuSelect },
                selectMenuCommandDispatcher(event as SelectMenuInteraction),
            )
            .with(
                { type: CommandType.MenuUser },
                ctxMenuUserDispatcher(event as UserContextMenuCommandInteraction),
            )
            .with(
                { type: CommandType.MenuMsg },
                ctxMenuMsgDispatcher(event as MessageContextMenuCommandInteraction),
            )
            .otherwise(() => {
                throw Error(SernError.MismatchModule);
            });
    }
}
