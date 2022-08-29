import type { Client } from 'discord.js';
import type SernEmitter from '../sernEmitter';
import type { EventModule } from '../../types/module';
import type { Result } from 'ts-results-es';
import type { Controller } from '../plugins/plugin';
import type { ScopedPlugin } from '../../types/handler';

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
    readonly configureDependencies?: (
        add: (dep : ScopedPlugin, controller: Controller) => void,
    ) => Result<void, void>
}

export default Wrapper;
