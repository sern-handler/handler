import { ObservableInput, concat, first, fromEvent, ignoreElements, pipe, tap } from 'rxjs';
import { _Module } from '../core/_internal';
import { Logging } from '../core/interfaces';
import type { DependencyList } from '../types/ioc';

const once = (log: Logging | undefined) => pipe(
    tap(() => { log?.info({ message: "Waiting on discord client to be ready..." }) }),
    first(),
    ignoreElements())

export function readyHandler(
    [sEmitter, , log ,, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    //Todo: add module manager on on ready
    const ready$ = fromEvent(client!, 'ready').pipe(once(log));
    
    concat(ready$)
        //.pipe(callInitPlugins(sEmitter))
//  const validModuleType = module.type >= 0 && module.type <= 1 << 10;
//  assert.ok(validModuleType, 
//      `Found ${module.name} at ${module.meta.fullPath}, which does not have a valid type`);
}


