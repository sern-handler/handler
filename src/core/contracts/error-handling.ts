import type { Observable } from 'rxjs';
import type { Logging } from './logging';
import util from 'node:util';
/**
 * @since 2.0.0
 */
export interface ErrorHandling {
    /**
     * Number of times the process should throw an error until crashing and exiting
     */
    keepAlive: number;

    /**
     * Utility function to crash
     * @param error
     */
    crash(error: Error): never;

    /**
     * A function that is called on every crash. Updates keepAlive
     * @param error
     */
    updateAlive(error: Error): void;
}
/**
 * @since 2.0.0
 */
export class DefaultErrorHandling implements ErrorHandling {
    keepAlive = 5;
    crash(error: Error): never {
        throw error;
    }
    updateAlive(_: Error) {
        this.keepAlive--;
    }
}

export function handleError<C>(crashHandler: ErrorHandling, logging?: Logging) {
    return (pload: unknown, caught: Observable<C>) => {
        // This is done to fit the ErrorHandling contract
        const err = pload instanceof Error ? pload : Error(util.format(pload));
        if (crashHandler.keepAlive == 0) {
            crashHandler.crash(err);
        }
        //formatted payload
        logging?.error({ message: util.format(pload) });
        crashHandler.updateAlive(err);
        return caught;
    };
}
