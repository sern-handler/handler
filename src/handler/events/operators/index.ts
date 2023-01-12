import {
    concatMap,
    defaultIfEmpty,
    EMPTY,
    every,
    map,
    Observable,
    of, OperatorFunction,
    pipe,
} from 'rxjs';
import type { AnyModule } from '../../../types/module';
import { nameOrFilename } from '../../utilities/functions';
import type { Result } from 'ts-results-es';
import type { Awaitable } from 'discord.js';

/**
 * if {src} is true, mapTo V, else ignore
 * @param item
 */
export function filterMapTo$<V>(item: () => V): OperatorFunction<boolean, V> {
    return pipe(concatMap( shouldKeep =>
            shouldKeep ? of(item()) : EMPTY
        ));
}

/**
 * Calls any plugin with {args}.
 * @param args if an array, its spread and plugin called.
 */
export function callPlugin$<V>(args: V): OperatorFunction<{ execute : (...args: any[]) => Awaitable<any>}, any> {
    return pipe(concatMap(async plugin => {
          if (Array.isArray(args)) {
              return plugin.execute(...args);
          }
          return plugin.execute(args);
    }));
}

/**
 * operator function that fill the defaults for a module,
 */
export function defineAllFields$<T extends AnyModule>(
    src: Observable<{ absPath: string; module: T }>,
) {
    const fillFields = ({ absPath, module }: { absPath: string; module: T }) => ({
        absPath,
        module: {
            name: nameOrFilename(module.name, absPath),
            description: module.description ?? '...',
            ...module,
        }
    });
    return src.pipe(
        map(fillFields),
    );
}

/**
 * Checks if the stream of results is all ok.
 * @param src
 */
export function everyPluginOk$() : OperatorFunction<Result<void, void>, boolean> {
    return pipe(
        every(result => result.ok),
        defaultIfEmpty(true),
    );
}