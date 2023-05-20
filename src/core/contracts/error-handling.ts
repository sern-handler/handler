/**
 * @since 2.0.0
 */
export interface ErrorHandling {
    /**
     * Number of times the process should throw an error until crashing and exiting
     */
    keepAlive: number;

    /**
     * A function that is called on every crash. Updates keepAlive.
     * If keepAlive is 0, the process crashes.
     * @param error
     */
    updateAlive(error: Error): void;
}
