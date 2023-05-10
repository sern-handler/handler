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
