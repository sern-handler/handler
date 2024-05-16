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
    Observable,
    of,
    OperatorFunction,
    pipe,
    share,
} from 'rxjs';
import type { Emitter, ErrorHandling, Logging } from './interfaces';
import util from 'node:util';
import type { PluginResult } from '../types/core-plugin';
import { Result } from 'ts-results-es';
import { VoidResult } from '../types/utility';
/**
 * if {src} is true, mapTo V, else ignore
 * @param item
 */
export function filterMapTo<V>(item: () => V): OperatorFunction<boolean, V> {
    return concatMap(keep => keep ? of(item()) : EMPTY);
}

interface PluginExecutable {
    execute: (...args: unknown[]) => PluginResult;
};
/**
 * Calls any plugin with {args}.
 * @param args if an array, its spread and plugin called.
 */
export function callPlugin(plugin: PluginExecutable, args: unknown)
{
    if (Array.isArray(args)) {
        return plugin.execute(...args);
    }
    return plugin.execute(args);
}

export const arrayifySource = <T>(src: T) => 
    Array.isArray(src) ? src : [src];

/**
 * Checks if the stream of results is all ok.
 */
export const everyPluginOk: OperatorFunction<VoidResult, boolean> = 
    pipe(every(result => result.isOk()), //this shortcircuits
         defaultIfEmpty(true));

export const sharedEventStream = <T>(e: Emitter, eventName: string) => 
    (fromEvent(e, eventName) as Observable<T>).pipe(share());


export function handleError<C>(crashHandler: ErrorHandling, emitter: Emitter, logging?: Logging) {
    return (pload: unknown, caught: Observable<C>) => {
        // This is done to fit the ErrorHandling contract
        if(!emitter.emit('error', pload)) {
            const err = pload instanceof Error ? pload : Error(util.inspect(pload, { colors: true }));
            logging?.error({ message: util.inspect(pload) });
            crashHandler.updateAlive(err);
        }
        return caught;
    };
}
//// Temporary until i get rxjs operators working on ts-results-es
export const filterTap = <K, R>(onErr: (e: R) => void): OperatorFunction<Result<K, R>, K> => 
    concatMap(result => {
        if(result.isOk()) {
            return of(result.value)
        }
        onErr(result.error);
        return EMPTY;
    })
