import type { Interaction } from 'discord.js';
import { concatMap, from, fromEvent, map, Observable } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import { EventsHandler } from './eventsHandler';
import {
    isApplicationCommand,
    isAutocomplete,
    isMessageComponent,
    isModalSubmit,
} from '../utilities/predicates';
import * as Files from '../utilities/readFile';
import { SernError } from '../structures/errors';
import { CommandType } from '../structures/enums';
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

export default class InteractionHandler extends EventsHandler<{
    event: Interaction;
    mod: CommandModule;
}> {
    protected override discordEvent: Observable<Interaction>;

    constructor(protected wrapper: Wrapper) {
        super(wrapper);
        this.discordEvent = <Observable<Interaction>>fromEvent(wrapper.client, 'interactionCreate');
        this.init();

        this.payloadSubject
            .pipe(
                map(this.processModules),
                concatMap(({ mod, execute, eventPluginRes }) => {
                    //resolve all the Results from event plugins
                    return from(eventPluginRes).pipe(map(res => ({ mod, res, execute })));
                }),
                concatMap(payload => executeModule(wrapper, payload)),
            )
            .subscribe({
                error: err => {
                    wrapper.sernEmitter?.emit('error', err);
                },
            });
    }

    override init() {
        this.discordEvent.subscribe({
            next: event => {
                if (isMessageComponent(event)) {
                    const mod = Files.MessageCompCommands[event.componentType].get(event.customId);
                    this.setState({ event, mod });
                } else if (isApplicationCommand(event) || isAutocomplete(event)) {
                    const mod =
                        Files.ApplicationCommands[event.commandType].get(event.commandName) ??
                        Files.BothCommands.get(event.commandName);
                    this.setState({ event, mod });
                } else if (isModalSubmit(event)) {
                    /**
                     * maybe move modal submits into message component object maps?
                     */
                    const mod = Files.ModalSubmitCommands.get(event.customId);
                    this.setState({ event, mod });
                } else {
                    throw Error('This interaction is not supported yet');
                }
            },
            error: e => {
                this.wrapper.sernEmitter?.emit('error', e);
            },
        });
    }

    protected setState(state: { event: Interaction; mod: CommandModule | undefined }): void {
        if (state.mod === undefined) {
            this.wrapper?.sernEmitter?.emit('warning', 'Found no module for this interaction');
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
