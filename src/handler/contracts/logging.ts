import type { LogPayload } from '../../types/handler';
/**
 * @since 2.0.0
 */
export interface Logging<T = unknown> {
    error(payload: LogPayload<T>): void;
    warning(payload: LogPayload<T>): void;
    info(payload: LogPayload<T>): void;
    debug(payload: LogPayload<T>): void;
}
/**
 * @since 2.0.0
 */
export class DefaultLogging implements Logging {
    private date = () => new Date();
    debug(payload: LogPayload): void {
        console.debug(`DEBUG: ${this.date().toISOString()} -> ${payload.message}`);
    }

    error(payload: LogPayload): void {
        console.error(`ERROR: ${this.date().toISOString()} -> ${payload.message}`);
    }

    info(payload: LogPayload): void {
        console.info(`INFO: ${this.date().toISOString()} -> ${payload.message}`);
    }

    warning(payload: LogPayload): void {
        console.warn(`WARN: ${this.date().toISOString()} -> ${payload.message}`);
    }
}
