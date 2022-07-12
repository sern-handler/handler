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
import type { CommandModule } from '../structures/module';
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
import type { ButtonInteraction, ModalSubmitInteraction, SelectMenuInteraction } from 'discord.js';
import type { UserContextMenuCommandInteraction } from 'discord.js';
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import { executeModule } from './observableHandling';

/**
 *
 */
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
            next: interaction => {
                if (isMessageComponent(interaction)) {
                    const mod = Files.MessageCompCommands[interaction.type].get(
                        interaction.customId,
                    );
                    this.setState({ event: interaction, mod });
                } else if (isApplicationCommand(interaction) || isAutocomplete(interaction)) {
                    const mod =
                        Files.ApplicationCommands[interaction.commandType].get(
                            interaction.commandName,
                        ) ?? Files.BothCommands.get(interaction.commandName);
                    this.setState({ event: interaction, mod });
                } else if (isModalSubmit(interaction)) {
                    /**
                     * maybe move modal submits into message component object maps?
                     */
                    const mod = Files.ModalSubmitCommands.get(interaction.customId);
                    this.setState({ event: interaction, mod });
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
            this.payloadSubject.error(SernError.UndefinedModule);
        } else {
            //if statement above checks already, safe cast
            this.payloadSubject.next(state as { event: Interaction; mod: CommandModule });
        }
    }

    protected processModules(payload: { event: Interaction; mod: CommandModule }) {
        return match(payload.mod)
            .with(
                { type: P.union(CommandType.Slash, CommandType.Both) },
                applicationCommandDispatcher(payload.event),
            )
            .with(
                { type: CommandType.Modal },
                modalCommandDispatcher(payload.event as ModalSubmitInteraction),
            )
            .with(
                { type: CommandType.Button },
                buttonCommandDispatcher(payload.event as ButtonInteraction),
            )
            .with(
                { type: CommandType.MenuSelect },
                selectMenuCommandDispatcher(payload.event as SelectMenuInteraction),
            )
            .with(
                { type: CommandType.MenuUser },
                ctxMenuUserDispatcher(payload.event as UserContextMenuCommandInteraction),
            )
            .with(
                { type: CommandType.MenuMsg },
                ctxMenuMsgDispatcher(payload.event as MessageContextMenuCommandInteraction),
            )
            .otherwise(() => {
                throw Error(SernError.MismatchModule);
            });
    }
}
