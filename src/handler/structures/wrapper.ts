import type { Client } from 'discord.js';
import type { DiscordEvent } from '../../types/handler';

/**
 * An object to be passed into Sern.Handler constructor.
 * @typedef {object} Wrapper
 * @property {readonly Client} client
 * @property {readonly string} defaultPrefix
 * @property {readonly string} commands
 * @prop {(handler : Handler) => void)} init
 * @prop { readonly DiscordEvent[] } events
 */
interface Wrapper {
    readonly client: Client;
    readonly defaultPrefix: string;
    readonly commands: string;
    readonly events? : DiscordEvent[];
}

export default Wrapper;
