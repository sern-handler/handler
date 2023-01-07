import type { SernEventsMapping } from '../../types/handler';
import type {
    ControlPlugin,
    InitPlugin,
} from '../plugins/plugin';
import type { Awaitable, ClientEvents } from 'discord.js';
import type { EventType } from './enums';
import type { Module } from '../../types/module';

export interface SernEventCommand<T extends keyof SernEventsMapping = keyof SernEventsMapping>
    extends Module {
    name?: T;
    type: EventType.Sern;
    onEvent: ControlPlugin[];
    plugins: InitPlugin[];
    execute(...args: SernEventsMapping[T]): Awaitable<unknown>;
}

export interface DiscordEventCommand<T extends keyof ClientEvents = keyof ClientEvents>
    extends Module {
    name?: T;
    type: EventType.Discord;
    onEvent: ControlPlugin[];
    plugins: InitPlugin[];
    execute(...args: ClientEvents[T]): Awaitable<unknown>;
}

export interface ExternalEventCommand extends Module {
    name?: string;
    emitter: string;
    type: EventType.External;
    onEvent: ControlPlugin[];
    plugins: InitPlugin[];
    execute(...args: unknown[]): Awaitable<unknown>;
}
