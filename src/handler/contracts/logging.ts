import type { SernEventsMapping } from '../../types/handler';

export interface Logging {
    error(...payload : SernEventsMapping['error']) : void;
    warning(...payload : SernEventsMapping['warning']) : void;
    info(payload: unknown) : void
}
