import type { CommandModule,Processed, EventModule } from "../../types/core-modules";

/**
 * @since 2.0.0
 */
export interface ErrorHandling {
    /**
     * @deprecated
     * Version 4 will remove this method
     */
    crash(err: Error): never;
    /**
     * A function that is called on every throw.
     * @param error
     */
    updateAlive(error: Error): void;

}
