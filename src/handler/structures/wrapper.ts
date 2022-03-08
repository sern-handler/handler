import type { Client } from 'discord.js';

/**
 * An object to be passed into Sern.Handler constructor.
 * @typedef {object} Wrapper
 * @property {readonly Client} client
 * @property {readonly string} prefix
 * @property {readonly string} commands
 * @prop {(handler : Handler) => void)} ini
 * @property {readonly {test: boolean, id: string}[]} privateServers
 */
interface Wrapper {
    readonly client: Client;
    readonly prefix: string;
    readonly commands: string;
    init?: (handler: Wrapper) => void;
    readonly privateServers: { test: boolean; id: string }[];
}

export default Wrapper;
