import type { Payload, SernEventsMapping } from '../../types/handler';
import type { Awaitable, ClientEvents } from 'discord.js';
import type { EventType } from './enums';
import type { Module } from '../../types/module';

export interface SernEventCommand<T extends keyof SernEventsMapping = keyof SernEventsMapping>
    extends Module {
    name?: T;
    type: EventType.Sern;
    execute(...args: [Payload]): Awaitable<unknown>;
}

export interface DiscordEventCommand<T extends keyof ClientEvents = keyof ClientEvents>
    extends Module {
    name?: T;
    type: EventType.Discord;
    execute(...args: ClientEvents[T]): Awaitable<unknown>;
}

export interface ExternalEventCommand extends Module {
    name?: string;
    emitter: string;
    type: EventType.External;
    execute(...args: unknown[]): Awaitable<unknown>;
}
