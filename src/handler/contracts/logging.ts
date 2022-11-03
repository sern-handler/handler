
export interface Logging {
    error(...payload : unknown[]) : void;
    warning(...payload : unknown[]) : void;
    info(...payload: unknown[]) : void
    debug(...payload: unknown[]) : void
}
