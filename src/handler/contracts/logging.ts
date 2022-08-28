import type { SernEventsMapping } from '../../types/handler';
import type { Client } from 'discord.js';

export interface Logging {

    error(...payload : SernEventsMapping['error']) : void;
    warning(...payload : SernEventsMapping['warning']) : void;
    moduleActivate(...warning : SernEventsMapping['module.activate']) : void;
    moduleRegister(...register : SernEventsMapping['module.register']) : void;

}
export interface LoggingConstructor {
    new(client: Client) : Logging
}
