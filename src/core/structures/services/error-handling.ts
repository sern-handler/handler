import { ErrorHandling } from '../../interfaces';

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
