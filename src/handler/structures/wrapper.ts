import type { Client } from 'discord.js';
import type SernEmitter from '../sernEmitter';
import type { EventModule } from '../../types/module';

/**
 * An object to be passed into Sern#init() function.
 * @typedef {object} Wrapper
 */
interface Wrapper {
    //@deprecated - Use Sern#makeDependencies instead
    readonly client: Client;
    //@deprecated - Use Sern#makeDependencies instead
    readonly sernEmitter?: SernEmitter;
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?:
        | string
        //@deprecated - array and function options will be removed
        | { mod: EventModule; absPath: string }[]
        //@deprecated - array and function options will be removed
        | (() => { mod: EventModule; absPath: string }[]);
}

export default Wrapper;
