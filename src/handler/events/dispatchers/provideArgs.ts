import type { ChatInputCommandInteraction, Interaction, Message } from 'discord.js';
import Context from '../../structures/context';
import type { SlashOptions } from '../../../types/handler';

export function contextArgs(i: Interaction | Message) {
    const ctx = Context.wrap(i as ChatInputCommandInteraction | Message);
    const args = ['slash', ctx.interaction.options];
    return () => [ctx, args] as [Context, ['slash', SlashOptions]];
}

export function interactionArg<T extends Interaction>(interaction: T) {
    return () => [interaction] as [T];
}
