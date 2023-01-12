import type { ChatInputCommandInteraction, Interaction, Message } from 'discord.js';
import Context from '../../structures/context';
import type { Args, SlashOptions } from '../../../types/handler';

/**
 * function overloads to create an arguments list for Context
 * @param wrap
 * @param messageArgs
 */
export function contextArgs(
    wrap: Message,
    messageArgs?: string[],
): () => [Context, ['text', string[]]];
export function contextArgs(wrap: Interaction): () => [Context, ['slash', SlashOptions]];
export function contextArgs(wrap: Interaction | Message, messageArgs?: string[]) {
    const ctx = Context.wrap(wrap as ChatInputCommandInteraction | Message);
    const args = ctx.isMessage() ? ['text', messageArgs!] : ['slash', ctx.interaction.options];
    return () => [ctx, args] as [Context, Args];
}

export function interactionArg<T extends Interaction>(interaction: T) {
    return () => [interaction] as [T];
}
