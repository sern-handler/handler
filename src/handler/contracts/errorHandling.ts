

export interface ErrorHandling {
    /**
     * MUTATES GLOBALLY
     */
    retry : number
    crash(error : Error) : unknown
}

export class DefaultErrorHandling implements ErrorHandling {
    retry = 5;
    crash(error: Error) {
        throw error;
    }
}