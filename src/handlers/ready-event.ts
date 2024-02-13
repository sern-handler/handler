import { ObservableInput, concat, first, fromEvent, ignoreElements, pipe } from 'rxjs';
import { CommandType } from '../core/structures';
import { SernError } from '../core/_internal';
import { Result } from 'ts-results-es';
import { ModuleManager } from '../core/contracts';
import { buildModules, callInitPlugins } from './_internal';
import * as assert from 'node:assert';
import * as util from 'node:util';
import type { DependencyList } from '../types/ioc';
import type { AnyModule, CommandMeta, Processed } from '../types/core-modules';

export function readyHandler(
    [sEmitter, , , moduleManager, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    const ready$ = fromEvent(client!, 'ready').pipe(once());

    return concat(ready$, buildModules<AnyModule>(allPaths, moduleManager))
        .pipe(callInitPlugins(sEmitter))
        .subscribe(({ module, metadata }) => {
            register(moduleManager, module, metadata)
                .expect(SernError.InvalidModuleType + ' ' + util.inspect(module));
        });
}

const once = () => pipe(
    first(),
    ignoreElements())


function register<T extends Processed<AnyModule>>(
    manager: ModuleManager,
    module: T,
    metadata: unknown 
): Result<void, void> {
    manager.setMetadata(module, metadata as CommandMeta)!;

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
    //@ts-ignore
    return Result.wrap(() => manager.set(metadata.id, module));
}
