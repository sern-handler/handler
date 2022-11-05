import type { SernEventsMapping } from '../../types/handler';
import type {
    DiscordEmitterPlugin,
    DiscordEventPlugin,
    ExternalEmitterPlugin,
    ExternalEventPlugin,
    SernEmitterPlugin,
    SernEventPlugin,
} from '../plugins/plugin';
import type { Awaitable, ClientEvents } from 'discord.js';
import type { EventType } from './enums';


export interface SernEventCommand<T extends keyof SernEventsMapping = keyof SernEventsMapping> {
    name?: T;
    type: EventType.Sern;
    onEvent: SernEventPlugin[];
    plugins: SernEmitterPlugin[];
    execute(...args: SernEventsMapping[T]): Awaitable<void | unknown>;
}

export interface DiscordEventCommand<T extends keyof ClientEvents = keyof ClientEvents> {
    name?: T;
    type: EventType.Discord;
    onEvent: DiscordEventPlugin[];
    plugins: DiscordEmitterPlugin[];
    execute(...args: ClientEvents[T]): Awaitable<unknown>;
}

export interface ExternalEventCommand {
    emitter: string;
    type: EventType.External;
    onEvent: ExternalEventPlugin[];
    plugins: ExternalEmitterPlugin[];
    execute(...args: unknown[]): Awaitable<unknown>;
}

// export type DiscordEventCommand<T extends keyof ClientEvents = keyof ClientEvents> = Override<
//     BaseModule,
//     {
//         name?: T;
//         type: EventType.Discord;
//         onEvent: DiscordEventPlugin[];
//         plugins: DiscordEmitterPlugin[];
//         execute(...args: ClientEvents[T]): Awaitable<void | unknown>;
//     }
// >;
// /*
//  * Type for any event emitter that can be handled by sern
//  */
// export type ExternalEventCommand = Override<
//     BaseModule,
//     {
//         emitter: string;
//         type: EventType.External;
//         onEvent: ExternalEventPlugin[];
//         plugins: ExternalEmitterPlugin[];
//         execute(...args: unknown[]): Awaitable<void | unknown>;
//     }
// >;
