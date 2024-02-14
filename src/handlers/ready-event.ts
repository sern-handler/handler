import { ObservableInput, concat, first, fromEvent, ignoreElements, pipe, tap } from 'rxjs';
import { CommandType } from '../core/structures';
import { SernError } from '../core/_internal';
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
    const ready$ = fromEvent(client!, 'ready').pipe(once(log));

    return concat(ready$, buildModules<AnyModule>(allPaths))
        .pipe(callInitPlugins(sEmitter))
        .subscribe(({ module, metadata }) => {
            register(moduleManager, module, metadata)
                .expect(SernError.InvalidModuleType + ' ' + util.inspect(module));
            //TODO: TEST ALL MODULES AGAIN
            console.log(module)
        });
}

const once = (log: Logging | undefined) => pipe(
    tap(() => { log?.info({ message: "Waiting on discord client to be ready..." }) }),
    first(),
    ignoreElements())


function register<T extends Processed<AnyModule>>(
    manager: ModuleManager,
    module: T,
    metadata:CommandMeta 
): Result<void, void> {
    manager.setMetadata(module, metadata)!;

    const validModuleType = module.type >= 0 && module.type <= 1 << 10;
    assert.ok(
        validModuleType,
        //@ts-ignore
        `Found ${module.name} at ${metadata.fullPath}, which does not have a valid type`,
    );
    if (module.type === CommandType.Both) {
        module.alias?.forEach(a => manager.set(`${a}_B`, module));
    } else {
        if(module.type === CommandType.Text){ 
            module.alias?.forEach(a => manager.set(`${a}_T`, module));
        }
    }
    return Result.wrap(() => manager.set(metadata.id, module));
}
