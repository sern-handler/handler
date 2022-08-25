import type { Client } from 'discord.js';
import type SernEmitter from '../sernEmitter';
import type { EventModule } from '../../types/module';
import type Logging from '../contracts/logging';
import type ModuleManager from '../contracts/moduleManager';

/**
 * An object to be passed into Sern#init() function.
 * @typedef {object} Wrapper
 */
interface Wrapper {
    readonly client: Client;
    readonly sernEmitter?: SernEmitter;
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?:
        | string
        | { mod: EventModule; absPath: string }[]
        | (() => { mod: EventModule; absPath: string }[]);
    readonly plugins ?: {
        logging ?: Logging;
        moduleManager ?: ModuleManager;
    }
}

export default Wrapper;
