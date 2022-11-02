import type { Observable } from 'rxjs';
import type { Logging } from './logging';


export interface ErrorHandling {
    /**
     * Number of times the process should throw an error until crashing and exiting
     */
    keepAlive : number

    /**
     * Utility function to crash
     * @param error
     */
    crash(error : Error) : never

    /**
     * A function that is called on every crash. Updates keepAlive
     * @param error
     */
    updateAlive(error: Error): void
}

export class DefaultErrorHandling implements ErrorHandling {
    keepAlive = 5;
    crash(error: Error): never {
        throw error;
    }
    updateAlive(_: Error) {
        this.keepAlive--;
    }
}

export function handleError<C>(crashHandler: ErrorHandling, logging: Logging) {
    return (error: Error, caught: Observable<C>) => {
        if(crashHandler.keepAlive == 0) {
            crashHandler.crash(error);
        }
        logging.error(error.message);
        crashHandler.updateAlive(error);
        return caught;
    };
}