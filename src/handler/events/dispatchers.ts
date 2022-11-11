import Context from '../structures/context';
import type { Payload, SlashOptions } from '../../types/handler';
import { resolveArrAsync } from '../utilities/resolveArrAsync';
import { controller } from '../sern';
import type {
    ButtonInteraction,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Interaction,
    UserContextMenuCommandInteraction,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { SernError } from '../structures/errors';
import treeSearch from '../utilities/treeSearch';
import type {
    BothCommand,
    ButtonCommand, ContextMenuMsg,
    ContextMenuUser,
    ModalSubmitCommand,
    SelectMenuCommand,
    SlashCommand,
} from '../../types/module';
import type SernEmitter from '../sernEmitter';
import { EventEmitter } from 'events';
import type { DiscordEventCommand, ExternalEventCommand, SernEventCommand } from '../structures/events';
import * as assert from 'assert';
import { _const } from '../utilities/functions';
import { concatMap, from, fromEvent, toArray } from 'rxjs';

export function applicationCommandDispatcher(interaction: Interaction) {
    if (interaction.isAutocomplete()) {
        return dispatchAutocomplete(interaction);
    } else {
        const ctx = Context.wrap(interaction as ChatInputCommandInteraction);
        const args: ['slash', SlashOptions] = ['slash', ctx.interaction.options];
        return (mod: BothCommand | SlashCommand) => ({
            mod,
            execute: () => mod.execute(ctx, args),
            eventPluginRes: resolveArrAsync(
                mod.onEvent.map(plugs => plugs.execute([ctx, args], controller)),
            ),
        });
    }
}

export function dispatchAutocomplete(interaction: AutocompleteInteraction) {
    return (mod: BothCommand | SlashCommand) => {
        const selectedOption = treeSearch(interaction, mod.options);
        if (selectedOption !== undefined) {
            return {
                mod,
                execute: () => selectedOption.command.execute(interaction),
                eventPluginRes: resolveArrAsync(
                    selectedOption.command.onEvent.map(e => e.execute(interaction, controller)),
                ),
            };
        }
        throw Error(
            SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`,
        );
    };
}

export function modalCommandDispatcher(interaction: ModalSubmitInteraction) {
    return (mod: ModalSubmitCommand) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: resolveArrAsync(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function buttonCommandDispatcher(interaction: ButtonInteraction) {
    return (mod: ButtonCommand) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: resolveArrAsync(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function selectMenuCommandDispatcher(interaction: SelectMenuInteraction) {
    return (mod: SelectMenuCommand) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: resolveArrAsync(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function ctxMenuUserDispatcher(interaction: UserContextMenuCommandInteraction) {
    return (mod: ContextMenuUser) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: resolveArrAsync(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function ctxMenuMsgDispatcher(interaction: MessageContextMenuCommandInteraction) {
    return (mod: ContextMenuMsg) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: resolveArrAsync(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function sernEmitterDispatcher(e: SernEmitter | undefined) {
    assert.ok(e !== undefined, 'SernEmitter is undefined, but tried creating SernEventCommand');
    return(cmd: SernEventCommand & { name: string }) => ({
        cmd,
        execute: _const(
            fromEvent(e, cmd.name)
                .pipe(
                    concatMap(event => from(
                        resolveArrAsync(
                            cmd.onEvent.map(plug => plug.execute([event] as [Payload] | [string], controller))
                    ))
                )
            )
        )
    });
}

export function discordEventDispatcher(e: EventEmitter) {
    return (cmd: DiscordEventCommand & { name: string }) => ({
        cmd,
        execute: _const(
            fromEvent(e, cmd.name)
                .pipe(
                    concatMap(event => from(
                        resolveArrAsync(
                            // god forbid I use any!!!
                            cmd.onEvent.map(plug => plug.execute([event as any], controller))
                        ))
                    )
                )
        )
    });
}

export function externalEventDispatcher(e: unknown) {
    assert.ok(e instanceof EventEmitter, `${e} is not an EventEmitter`);
    return (cmd: ExternalEventCommand & { name: string}) => ({
        cmd,
        execute: _const(
            fromEvent(e, cmd.name)
                .pipe(
                    concatMap(event => from(
                        resolveArrAsync(
                            cmd.onEvent.map(plug => plug.execute([event], controller))
                        ))
                    )
                )
        )
    });
}