import { concatMap, defaultIfEmpty, EMPTY, every, map, Observable, of } from 'rxjs';
import type { ControlPlugin, InitPlugin } from '../../plugins';
import type { AnyModule } from '../../../types/module';
import { nameOrFilename } from '../../utilities/functions';
import type { Result } from 'ts-results-es';

/**
 * if {src} is true, mapTo V, else ignore
 * @param item
 */
export function filterMapTo$<V>(item: () => V) {
    return (src: Observable<boolean>) => src.pipe(
        concatMap( shouldKeep =>
            shouldKeep ? of(item()) : EMPTY
        )
    );
}

/**
 * Calls any plugin with {args}.
 * @param args if an array, its spread and plugin called.
 */
export function callPlugin$<V>(args: V) {
    return (src: Observable<ControlPlugin | InitPlugin>) =>
        src.pipe(concatMap(async plugin => {
            if (Array.isArray(args)) {
                return plugin.execute(...args);
            }
            return plugin.execute(args);
        }));
}

/**
 * fills the defaults for modules
 * signature : Observable<{ absPath: string; module: CommandModule | EventModule }> -> Observable<{ absPath: string; module: Processed<CommandModule | EventModule> }>
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
export function everyPluginOk$(src: Observable<Result<void, void>>) {
    return src.pipe(
        every(result => result.ok),
        defaultIfEmpty(true),
    );
}