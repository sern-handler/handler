import type { Client } from 'discord.js';
import type { DiscordEvent } from '../../types/handler';

/**
 * An object to be passed into Sern.Handler constructor.
 * @typedef {object} Wrapper
 * @property {readonly Client} Client
 * @property {readonly string} The default prefix
 * @property {readonly string} Commands
 * @prop {(handler: Handler) => void)} init
 * @prop { readonly DiscordEvent[] } Events
 */

interface Wrapper {
  readonly client: Client;
  readonly defaultPrefix: string;
  readonly commands: string;
  init?: (handler: Wrapper) => void;
  readonly events?: DiscordEvent[];
}

export default Wrapper;
