
import type {
    CommandInteractionOptionResolver,
    MessagePayload,
    MessageOptions,
} from 'discord.js';

import type Module from '../handler/structures/module';

export type Visibility = 'private' | 'public';

// Anything that can be sent in a `<TextChannel>#send` or `<CommandInteraction>#reply`
export type possibleOutput<T = string> = T | (MessagePayload & MessageOptions);
export type execute = Module<unknown>['execute'];
// Thanks @cursorsdottsx
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];


export type Arg = ParseType<{ text: string[]; slash: SlashOptions }>;

// TypeAlias for interaction.options
export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;
