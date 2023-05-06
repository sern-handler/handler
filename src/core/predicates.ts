import {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import { InteractionType } from 'discord.js';

interface InteractionTypable {
    type: InteractionType;
}
//discord.js pls fix ur typings or i will >:(
type AnyMessageComponentInteraction = AnySelectMenuInteraction | ButtonInteraction;
type AnyCommandInteraction =
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction;
export function isMessageComponent(i: InteractionTypable): i is AnyMessageComponentInteraction {
    return i.type === InteractionType.MessageComponent;
}
export function isCommand(i: InteractionTypable): i is AnyCommandInteraction {
    return i.type === InteractionType.ApplicationCommand;
}
export function isAutocomplete(i: InteractionTypable): i is AutocompleteInteraction {
    return i.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isModal(i: InteractionTypable): i is ModalSubmitInteraction {
    return i.type === InteractionType.ModalSubmit;
}
