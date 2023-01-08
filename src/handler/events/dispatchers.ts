import Context from '../structures/context';
import type { Args, Payload } from '../../types/handler';
import { arrAsync } from '../utilities/arrAsync';
import { controller } from '../sern';
import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ClientEvents,
    Interaction,
} from 'discord.js';
import { SernError } from '../structures/errors';
import treeSearch from '../utilities/treeSearch';
import type {
    BothCommand,
    CommandModule,
    EventModule,
    Module,
    SlashCommand,
} from '../../types/module';
import type SernEmitter from '../sernEmitter';
import { EventEmitter } from 'events';
import type { DiscordEventCommand, ExternalEventCommand, SernEventCommand } from '../structures/events';
import * as assert from 'assert';
import { reducePlugins } from '../utilities/functions';
import { concatMap, from, fromEvent, map, of } from 'rxjs';
import type { CommandArgs, EventArgs } from '../plugins';
import type { CommandType, EventType, PluginType } from '../structures/enums';
import type { Message } from 'discord.js';

export function dispatcher(
    module: Module,
    createArgs: () => unknown[],
) {
    const args = createArgs();
    return {
        module,
        execute: () => module.execute(args),
        controlResult: () => arrAsync(module.onEvent.map(plugs => plugs.execute(args))),
    };
}

export function commandDispatcher<V extends CommandType>(
    module: CommandModule,
    createArgs: () => CommandArgs<V, PluginType.Control>,
) {
    return dispatcher(module, createArgs);
}

function eventDispatcher<V extends EventType>(
    module: EventModule,
    createArgs: () => EventArgs<V, PluginType.Control>,
) {
    return dispatcher(module, createArgs);
}

export function contextArgs(i: Interaction | Message) {
    const ctx = Context.wrap(i as ChatInputCommandInteraction | Message);
    const args = ['slash', ctx.interaction.options];
    return () => [ctx, args] as [Context, ['slash', Args]];
}
export function interactionArg<T extends Interaction>(interaction : T) {
    return () => [interaction] as [T];
}
export function dispatchAutocomplete(module: BothCommand | SlashCommand, interaction: AutocompleteInteraction) {
    const option = treeSearch(interaction, module.options);
    if (option !== undefined) {
        return {
            module,
            execute: () => option.command.execute(interaction),
            controlResult: () => arrAsync(option.command.onEvent.map(e => e.execute(interaction))),
        };
    }
    throw Error(
        SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`,
    );
}

export function sernEmitterDispatcher(e: SernEmitter) {
    return (cmd: SernEventCommand & { name: string }) => ({
        source: e,
        cmd,
        execute: fromEvent(e, cmd.name).pipe(
            map(event => ({
                event,
                executeEvent: of(event).pipe(
                    concatMap(event =>
                        reducePlugins(
                            from(
                                arrAsync(
                                    cmd.onEvent.map(plug => plug.execute(event as Payload)),
                                ),
                            ),
                        ),
                    ),
                ),
            })),
        ),
    });
}

export function discordEventDispatcher(e: EventEmitter) {
    return (cmd: DiscordEventCommand & { name: string }) => ({
        source: e,
        cmd,
        execute: fromEvent(e, cmd.name).pipe(
            map(event => ({
                event,
                executeEvent: of(event).pipe(
                    concatMap(event =>
                        reducePlugins(
                            from(
                                arrAsync(
                                    cmd.onEvent.map(plug => plug.execute(...event as ClientEvents[keyof ClientEvents])),
                                ),
                            ),
                        ),
                    ),
                ),
            })),
        ),
    });
}

export function externalEventDispatcher(e: (e: ExternalEventCommand) => unknown) {
    return (cmd: ExternalEventCommand & { name: string }) => {
        const external = e(cmd);
        assert.ok(external instanceof EventEmitter, `${e} is not an EventEmitter`);
        return {
            source: external,
            cmd,
            execute: fromEvent(external, cmd.name).pipe(
                map(event => ({
                    event,
                    executeEvent: of(event).pipe(
                        concatMap(event =>
                            reducePlugins(
                                from(
                                    arrAsync(
                                        cmd.onEvent.map(plug => plug.execute(event, controller)),
                                    ),
                                ),
                            ),
                        ),
                    ),
                })),
            ),
        };
    };
}
