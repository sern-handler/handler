import { ApplicationCommandType, ComponentType, Interaction, InteractionType } from 'discord.js';
import { CommandType, EventType } from './structures';

/**
 * Construct unique ID for a given interaction object.
 * @param event The interaction object for which to create an ID.
 * @returns An array of unique string IDs based on the type and properties of the interaction object.
 */
export function reconstruct<T extends Interaction>(event: T) {
    switch (event.type) {
        case InteractionType.MessageComponent: return [`${event.customId}_C${event.componentType}`];
        case InteractionType.ApplicationCommand:
        case InteractionType.ApplicationCommandAutocomplete: 
            return [`${event.commandName}_A${event.commandType}`, `${event.commandName}_B`];
        //Modal interactions are classified as components for sern
        case InteractionType.ModalSubmit: return [`${event.customId}_M`];
    }
}
/**
 *
 * A magic number to represent any commandtype that is an ApplicationCommand.
 */
const appBitField = 0b000000001111;


const TypeMap = new Map<number, number>([
    [CommandType.Text, 0],
    [CommandType.Both, 0],
    [CommandType.Slash, ApplicationCommandType.ChatInput],
    [CommandType.CtxUser, ApplicationCommandType.User],
    [CommandType.CtxMsg, ApplicationCommandType.Message],
    [CommandType.Button, ComponentType.Button],
    [CommandType.Modal, InteractionType.ModalSubmit],
    [CommandType.StringSelect, ComponentType.StringSelect],
    [CommandType.UserSelect, ComponentType.UserSelect],
    [CommandType.MentionableSelect, ComponentType.MentionableSelect],
    [CommandType.RoleSelect, ComponentType.RoleSelect],
    [CommandType.ChannelSelect, ComponentType.ChannelSelect]]);

/*
 * Generates an id based on name and CommandType.
 * A is for any ApplicationCommand. C is for any ComponentCommand
 * Then, another number fetched from TypeMap
 */
export function create(name: string, type: CommandType | EventType) {
    if(type == CommandType.Text) {
        return `${name}_T`;
    }
    if(type == CommandType.Both) {
        return `${name}_B`;
    }
    if(type == CommandType.Modal) {
        return `${name}_M`;
    }
    const am = (appBitField & type) !== 0 ? 'A' : 'C';
    return `${name}_${am}${TypeMap.get(type)!}`
}



