/**
 * This file holds sern's rxjs operators used for processing data.
 * Each function should be modular and testable, not bound to discord / sern
 * and independent of each other.
 */
import {
    concatMap,
    defaultIfEmpty,
    EMPTY,
    every,
    fromEvent,
    map,
    Observable,
    of,
    OperatorFunction,
    pipe,
    share,
} from 'rxjs';
import { Emitter, ErrorHandling, Logging } from './contracts';
import util from 'node:util';
import { PluginResult, VoidResult } from '../types/core-plugin';
/**
 * if {src} is true, mapTo V, else ignore
 * @param item
 */
export function filterMapTo<V>(item: () => V): OperatorFunction<boolean, V> {
    return concatMap(shouldKeep => (shouldKeep ? of(item()) : EMPTY));
}

/**
 * Calls any plugin with {args}.
 * @param args if an array, its spread and plugin called.
 */
export function callPlugin(args: unknown): OperatorFunction<
    {
        execute: (...args: unknown[]) => PluginResult;
    },
    VoidResult
> {
    return concatMap(async plugin => {
        if (Array.isArray(args)) {
            return plugin.execute(...args);
        }
        return plugin.execute(args);
    });
}

export const arrayifySource = map(src => (Array.isArray(src) ? (src as unknown[]) : [src]));


/**
 * Checks if the stream of results is all ok.
 */
export const everyPluginOk: OperatorFunction<VoidResult, boolean> = pipe(
    every(result => result.ok),
    defaultIfEmpty(true),
);

export const sharedEventStream = <T>(e: Emitter, eventName: string) => {
    return (fromEvent(e, eventName) as Observable<T>).pipe(share());
};

export function handleError<C>(crashHandler: ErrorHandling, logging?: Logging) {
    return (pload: unknown, caught: Observable<C>) => {
        // This is done to fit the ErrorHandling contract
        const err = pload instanceof Error ? pload : Error(util.inspect(pload, { colors: true }));
        //formatted payload
        logging?.error({ message: util.inspect(pload) });
        crashHandler.updateAlive(err);
        return caught;
    };
}
