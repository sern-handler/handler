import { concatMap, defaultIfEmpty, EMPTY, every, map, of, OperatorFunction, pipe } from 'rxjs';
import type { AnyModule } from '../../../types/module';
import { nameOrFilename } from '../../utilities/functions';
import type { PluginResult, VoidResult } from '../../../types/plugin';

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
export function callPlugin<V>(args: V): OperatorFunction<
    {
        execute: (...args: unknown[]) => PluginResult;
    },
    VoidResult
> {
    return pipe(
        concatMap(async plugin => {
            if (Array.isArray(args)) {
                return plugin.execute(...args);
            }
            return plugin.execute(args);
        }),
    );
}

/**
 * operator function that fill the defaults for a module
 */
export function defineAllFields<T extends AnyModule>() {
    const fillFields = ({ absPath, module }: { absPath: string; module: T }) => ({
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
 * Checks if the stream of results is all ok.
 */
export function everyPluginOk(): OperatorFunction<VoidResult, boolean> {
    return pipe(
        every(result => result.ok),
        defaultIfEmpty(true),
    );
}
