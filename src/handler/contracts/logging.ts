import type { LogPayload } from '../../types/handler';

export interface Logging {
    error(payload : LogPayload) : void;
    warning(payload : LogPayload) : void;
    info(payload : LogPayload) : void
    debug(payload : LogPayload) : void
}

export class DefaultLogging implements Logging {
    debug(payload: LogPayload): void {
        console.debug(`DEBUG -> ${payload.message}`);
    }

    error(payload: LogPayload): void {
        console.error(`ERROR -> ${payload.message}`);
    }

    info(payload: LogPayload): void {
        console.info(`INFO -> ${payload.message}`);
    }

    warning(payload: LogPayload): void {
        console.warn(`WARN -> ${payload.message}`);
    }

}
