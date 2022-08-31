import type { SernEventsMapping } from '../../types/handler';
import type { ScopedPlugin } from '../../types/handler';

export interface Logging extends ScopedPlugin {
    error(...payload : SernEventsMapping['error']) : void;
    warning(...payload : SernEventsMapping['warning']) : void;
    moduleActivate(...warning : SernEventsMapping['module.activate']) : void;
    moduleRegister(...register : SernEventsMapping['module.register']) : void;
}

export interface LoggingConstructor {
    new() : Logging
}