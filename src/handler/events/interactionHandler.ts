import type { Interaction } from 'discord.js';
import { concatMap, from, fromEvent, map, Observable, of } from 'rxjs';
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
import type { ButtonInteraction, ModalSubmitInteraction, SelectMenuInteraction } from 'discord.js';
import type { UserContextMenuCommandInteraction } from 'discord.js';
import type { MessageContextMenuCommandInteraction } from 'discord.js';

/**
 *
 */
export default class InteractionHandler extends EventsHandler<{
    event: Interaction;
    module: CommandModule;
}> {
    protected override observable: Observable<Interaction>;

    constructor(protected wrapper: Wrapper) {
        super(wrapper);
        this.observable = <Observable<Interaction>>fromEvent(wrapper.client, 'interactionCreate');
        this.init();

        this.payloadSubject
            .pipe(
                map(this.processModules),
                concatMap(({ module, execute, eventPluginRes }) => {
                    //resolve all the Results from event plugins
                    return from(eventPluginRes).pipe(map(res => ({ module, res, execute })));
                }),
                concatMap(payload => {
                    // resolves the Awaitable<unknown> of payload.execute
                    if (payload.res.every(el => el.ok)) {
                        wrapper.sernEmitter?.emit('module.activate', {
                            type: PayloadType.Success,
                            module: payload.module,
                        }); //todo : emit activation event after promise resolves
                        return from(payload.execute() as Promise<unknown>);
                    } else {
                        wrapper.sernEmitter?.emit('module.activate', {
                            type: PayloadType.Failure,
                            module: payload.module,
                            reason: SernError.PluginFailure,
                        });
                        return of(null);
                    }
                }),
            )
            .subscribe({
                error: err => {
                    wrapper.sernEmitter?.emit('error', err);
                },
            });
    }

    override init() {
        this.observable.subscribe({
            next: interaction => {
                if (isMessageComponent(interaction)) {
                    const module = Files.MessageCompCommands[interaction.type].get(
                        interaction.customId,
                    );
                    this.setState({ event: interaction, module });
                } else if (isApplicationCommand(interaction) || isAutocomplete(interaction)) {
                    const module =
                        Files.ApplicationCommands[interaction.commandType].get(
                            interaction.commandName,
                        ) ?? Files.BothCommands.get(interaction.commandName);
                    this.setState({ event: interaction, module });
                } else if (isModalSubmit(interaction)) {
                    /**
                     * maybe move modal submits into message component object maps?
                     */
                    const module = Files.ModalSubmitCommands.get(interaction.customId);
                    this.setState({ event: interaction, module });
                } else {
                    throw Error('This interaction is not supported yet');
                }
            },
            error: e => {
                this.wrapper.sernEmitter?.emit('error', e);
            },
        });
    }

    protected setState(state: { event: Interaction; module: CommandModule | undefined }): void {
        if (state.module === undefined) {
            this.payloadSubject.error(SernError.UndefinedModule);
        } else {
            //if statement above checks already, safe cast
            this.payloadSubject.next(state as { event: Interaction; module: CommandModule });
        }
    }

    protected processModules(payload: { event: Interaction; module: CommandModule }) {
        return match(payload.module)
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
