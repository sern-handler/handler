import type { Message, ChatInputCommandInteraction } from 'discord.js';
import type { Args, SlashOptions } from '../../../types/handler';
import { Context } from '../../../classic/context';

/*
 * @overload
 */
export function contextArgs(
    wrap: Message,
    messageArgs?: string[],
): () => [Context, ['text', string[]]];
/*
 * @overload
 */
export function contextArgs(
    wrappable: ChatInputCommandInteraction,
): () => [Context, ['slash', SlashOptions]];
/**
 * function overloads to create an arguments list for Context
 * @param wrap
 * @param messageArgs
 */
export function contextArgs(
    wrappable: Message | ChatInputCommandInteraction,
    messageArgs?: string[],
) {
    const ctx = Context.wrap(wrappable);
    const args = ctx.isMessage() ? ['text', messageArgs!] : ['slash', ctx.options];
    return () => [ctx, args] as [Context, Args];
}

export function interactionArg<T>(interaction: T) {
    return () => [interaction] as [T];
}
