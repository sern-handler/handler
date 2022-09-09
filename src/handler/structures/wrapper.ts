import type { Client } from 'discord.js';
import type SernEmitter from '../sernEmitter';
import type { EventModule } from '../../types/module';
import type { NodeApi } from 'iti';

/**
 * An object to be passed into Sern#init() function.
 * @typedef {object} Wrapper
 */
interface Wrapper {
    //@deprecrated Use Wrapper#addDependencies instead.
    readonly client: Client;
    readonly sernEmitter?: SernEmitter;
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?:
        | string
        | { mod: EventModule; absPath: string }[]
        | (() => { mod: EventModule; absPath: string }[]);
    readonly addDependencies: (rootBuilder: NodeApi<{}>) => void
}

export default Wrapper;
