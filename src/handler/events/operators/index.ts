/**
 * This file holds sern's rxjs operators used for processing data.
 * Each function should be modular and testable, not bound to discord / sern
 * and independent of each other
 */

import { concatMap, defaultIfEmpty, EMPTY, every, map, of, OperatorFunction, pipe } from 'rxjs';
import type { AnyModule } from '../../../types/module';
import { nameOrFilename } from '../../utilities/functions';
import type { PluginResult, VoidResult } from '../../../types/plugin';
import { guayin } from '../../plugins';
import { controller } from '../../sern';
import { SernError } from '../../structures';
import { Result } from 'ts-results-es';

/**
 * if {src} is true, mapTo V, else ignore
 * @param item
 */
export function filterMapTo<V>(item: () => V): OperatorFunction<boolean, V> {
    return pipe(concatMap(shouldKeep => (shouldKeep ? of(item()) : EMPTY)));
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
    return pipe(
        concatMap(async plugin => {
            const isNewPlugin = Reflect.has(plugin, guayin);
            if (isNewPlugin) {
                if (Array.isArray(args)) {
                    return plugin.execute(...args);
                }
                return plugin.execute(args);
            } else {
                return plugin.execute(args, controller);
            }
        }),
    );
}

/**
 * operator function that fill the defaults for a module
 */
export function defineAllFields<T extends AnyModule>() {
    const fillFields = ({ module, absPath }: { module: T; absPath: string }) => ({
        absPath,
        module: {
            name: nameOrFilename(module.name, absPath),
            description: module.description ?? '...',
            ...module,
        },
    });
    return pipe(map(fillFields));
}

/**
 * If the current value in Result stream is an error, calls callback.
 * This also extracts the Ok value from Result
 * @param cb
 * @returns Observable<{ module: T; absPath: string }>
 */
export function errTap<T extends AnyModule>(
    cb: (err: SernError) => void
): OperatorFunction<Result<{ module: T; absPath: string}, SernError>, { module: T; absPath: string }> {
   return pipe(
      concatMap(result => {
         if(result.ok) {
            return of(result.val);
         } else {
            cb(result.val);
            return EMPTY; 
         }
      })
    );
}

/**
 * Checks if the stream of results is all ok.
 */
export const everyPluginOk: OperatorFunction<VoidResult, boolean> = 
    pipe(
        every(result => result.ok),
        defaultIfEmpty(true),
    );

