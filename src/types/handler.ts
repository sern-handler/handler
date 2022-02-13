import type { Option } from 'ts-results';

import type {
  CommandInteraction,
  CommandInteractionOptionResolver,
  Message,
  MessagePayload,
  MessageOptions
} from 'discord.js';

import type * as Sern from '../Handler/sern';

export type Visibility = 'private' | 'public';

// Anything that can be sent in a `<TextChannel>#send` or `<CommandInteraction>#reply`
export type possibleOutput<T = string> = T | MessagePayload & MessageOptions;
export type Nullable<T> = T | null;
export type delegate = Sern.Module<unknown>['delegate'];

// Thanks @cursorsdottsx
export type ParseType<T> = {
  [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
} [keyof T];

// A Sern.Module['delegate'] will carry a Context Parameter

export type Context = {
  message: Option<Message>,
  interaction: Option<CommandInteraction>
}
<<<<<<< HEAD

export type Arg = ParseType<{ text: string, slash: SlashOptions }>;
=======
// `string` | `SlashOptions`, narrow down your type by checking `text` | `slash`
export type Arg = ParseType<{text : string, slash : SlashOptions}>
>>>>>>> 6ce7649311f1d077f6437528cbad10da16e58435
    
// TypeAlias for interaction.options
export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;
