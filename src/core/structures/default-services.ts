import type { LogPayload, Logging, ErrorHandling } from '../interfaces';
/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using the defaults!
 */
export class DefaultErrorHandling implements ErrorHandling {
    crash(err: Error): never {
        throw err;
    }

    #keepAlive = 1;

    updateAlive(err: Error) {
        this.#keepAlive--;
        if (this.#keepAlive === 0) {
            throw err;
        }
    }
}


/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
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
