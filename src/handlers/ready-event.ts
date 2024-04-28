import { ObservableInput, concat, first, fromEvent, ignoreElements, pipe, tap } from 'rxjs';
import { SernError, _Module } from '../core/_internal';
import { Result } from 'ts-results-es';
import { Logging, ModuleManager } from '../core/contracts';
import { buildModules, callInitPlugins } from './_internal';
import * as assert from 'node:assert';
import * as util from 'node:util';
import type { DependencyList } from '../types/ioc';
import type { AnyModule, CommandMeta, Processed } from '../types/core-modules';

export function readyHandler(
    [sEmitter, , log , moduleManager, client]: DependencyList,
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

const once = (log: Logging | undefined) => pipe(
    tap(() => { log?.info({ message: "Waiting on discord client to be ready..." }) }),
    first(),
    ignoreElements())
