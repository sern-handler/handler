import type { Client } from 'discord.js';
import type { DiscordEvent } from '../../types/handler';

/**
 * An object to be passed into Sern.Handler constructor.
 * @typedef {object} Wrapper
 * @property {readonly Client} client
 * @property {readonly string} defaultPrefix
 * @property {readonly string} commands
 * @prop {(handler : Handler) => void)} init
 * @property {readonly {test: boolean, id: string}[]} privateServers
 * @prop { readonly DiscordEvent[] } events
 */
interface Wrapper {
    readonly client: Client;
    readonly defaultPrefix: string;
    readonly commands: string;
    init?: (handler: Wrapper) => void;
    readonly privateServers: { test: boolean; id: string }[];
    readonly events? : DiscordEvent[];
}

export default Wrapper;
