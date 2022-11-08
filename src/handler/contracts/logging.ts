import type { LogPayload } from '../../types/handler';

export interface Logging {
    error(payload : LogPayload) : void;
    warning(payload : LogPayload) : void;
    info(payload : LogPayload) : void
    debug(payload : LogPayload) : void
}
