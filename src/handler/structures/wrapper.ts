import type { Client } from 'discord.js';
import type { DiscordEvent, EventEmitterRegister, SernEvent } from '../../types/handler';
import type SernEmitter from '../sernEmitter';

/**
 * An object to be passed into Sern.Handler constructor.
 * @typedef {object} Wrapper
 * @property {readonly Client} client
 * @property {readonly string} defaultPrefix
 * @property {readonly string} commands
 * @prop { readonly DiscordEvent[] } events
 */
interface Wrapper {
    readonly client: Client;
    readonly sernEmitter?: SernEmitter;
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?: (DiscordEvent | EventEmitterRegister | SernEvent)[];
}

export default Wrapper;
