import type {
    BothCommand,
    ButtonCommand,
    ContextMenuMsg,
    ContextMenuUser,
    ModalSubmitCommand,
    SelectMenuCommand,
    SlashCommand,
} from '../structures/module';
import Context from '../structures/context';
import type { SlashOptions } from '../../types/handler';
import { asyncResolveArray } from '../utilities/asyncResolveArray';
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
import { isAutocomplete } from '../utilities/predicates';
import { SernError } from '../structures/errors';
import treeSearch from '../utilities/treeSearch';

export function applicationCommandDispatcher(interaction: Interaction) {
    if (isAutocomplete(interaction)) {
        return dispatchAutocomplete(interaction);
    } else {
        const ctx = Context.wrap(interaction as ChatInputCommandInteraction);
        const args: ['slash', SlashOptions] = ['slash', ctx.interaction.options];
        return (mod: BothCommand | SlashCommand) => ({
            mod,
            execute: () => mod.execute(ctx, args),
            eventPluginRes: asyncResolveArray(
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
                eventPluginRes: asyncResolveArray(
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
        eventPluginRes: asyncResolveArray(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function buttonCommandDispatcher(interaction: ButtonInteraction) {
    return (mod: ButtonCommand) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: asyncResolveArray(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function selectMenuCommandDispatcher(interaction: SelectMenuInteraction) {
    return (mod: SelectMenuCommand) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: asyncResolveArray(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function ctxMenuUserDispatcher(interaction: UserContextMenuCommandInteraction) {
    return (mod: ContextMenuUser) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: asyncResolveArray(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}

export function ctxMenuMsgDispatcher(interaction: MessageContextMenuCommandInteraction) {
    return (mod: ContextMenuMsg) => ({
        mod,
        execute: () => mod.execute(interaction),
        eventPluginRes: asyncResolveArray(
            mod.onEvent.map(plugs => plugs.execute([interaction], controller)),
        ),
    });
}
