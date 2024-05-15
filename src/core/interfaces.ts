import type { AnyFunction } from '../types/utility';


/**
 * Represents an initialization contract.
 * Let dependencies implement this to initiate some logic.
 */
export interface Init {
    init(): unknown;
}

/**
 * Represents a Disposable contract.
 * Let dependencies implement this to dispose and cleanup.
 */
export interface Disposable {
    dispose(): unknown;
}


export interface Emitter {
    addListener(eventName: string | symbol, listener: AnyFunction): this;
    removeListener(eventName: string | symbol, listener: AnyFunction): this;
    emit(eventName: string | symbol, ...payload: any[]): boolean;
    on(eventName: string | symbol, listener: AnyFunction): this
}


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

/**
 * @since 2.0.0
 */
export interface Logging<T = unknown> {
    error(payload: LogPayload<T>): void;
    warning(payload: LogPayload<T>): void;
    info(payload: LogPayload<T>): void;
    debug(payload: LogPayload<T>): void;
}

export type LogPayload<T = unknown> = { message: T };
