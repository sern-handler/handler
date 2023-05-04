import { AutocompleteInteraction, CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { BaseInteraction,  InteractionType, MessageComponentInteraction } from "discord.js";


export function isMessageComponent(i: BaseInteraction): i is MessageComponentInteraction {
    return i.type === InteractionType.MessageComponent;
}

export function isCommand(i: BaseInteraction): i is CommandInteraction {
    return i.type === InteractionType.ApplicationCommand;
}
export function isAutocomplete(i: BaseInteraction): i is AutocompleteInteraction {
    return i.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isModal(i: BaseInteraction): i is ModalSubmitInteraction {
    return i.type === InteractionType.ModalSubmit;
}
