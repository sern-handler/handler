import type { Client } from 'discord.js';
import type { DiscordEvent, EventEmitterRegister, SernEvent } from '../../types/handler';
import type SernEmitter from '../sernEmitter';
import type { EventModule } from './module';

/**
 * An object to be passed into Sern.Handler constructor.
 * @typedef {object} Wrapper
 * @property {readonly Client} client
 * @prop { readonly SernEmitter } sernEmitter
 * @property {readonly string} defaultPrefix
 * @property {readonly string} commands
 * @prop { readonly DiscordEvent[] } events
 */
interface Wrapper {
    readonly client: Client;
    readonly sernEmitter?: SernEmitter;
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?: EventModule[] | string | (() => EventModule[]);
}

export default Wrapper;
