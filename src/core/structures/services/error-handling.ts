import { ErrorHandling } from "../../contracts";

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
