import type { Observable } from 'rxjs';
import type { Logging } from './logging';
import { useContainerRaw } from '../dependencies/provider';

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
    updateAlive(e: Error) {
        this.keepAlive--;
    }
}

export function handleError<C>(crashHandler: ErrorHandling, logging?: Logging) {
    return async (error: Error, caught: Observable<C>) => {
        if(crashHandler.keepAlive == 0) {
            await useContainerRaw()?.disposeAll();
            crashHandler.crash(error);
        }
        logging?.error({ message: JSON.stringify(error) });
        crashHandler.updateAlive(error);
        return caught;
    };
}