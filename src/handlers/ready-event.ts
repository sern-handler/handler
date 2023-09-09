import { ObservableInput, concat, first, fromEvent, ignoreElements, pipe } from 'rxjs';
import { CommandType } from '../core/structures';
import { SernError } from '../core/_internal';
import { Result } from 'ts-results-es';
import { ModuleManager } from '../core/contracts';
import { buildModules, callInitPlugins } from './_internal';
import * as assert from 'node:assert';
import * as util from 'node:util';
import type { DependencyList } from '../types/ioc';
import type { AnyModule, Processed } from '../types/core-modules';

export function startReadyEvent(
    [sEmitter, , , moduleManager, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    const ready$ = fromEvent(client!, 'ready').pipe(once());

    return concat(ready$, buildModules<AnyModule>(allPaths, moduleManager))
        .pipe(callInitPlugins(sEmitter))
        .subscribe(({ module, onError }) => {
            register(moduleManager, module)
                .expect(SernError.InvalidModuleType + ' ' + util.inspect(module));
            registerOnError(moduleManager, module, onError);
            
        });
}

const once = () => pipe(
    first(),
    ignoreElements()
)

const registerOnError = (manager: ModuleManager, module: Processed<AnyModule>, onError: Function|undefined) => {
    if(onError) {
        manager.setErrorCallback(module, onError) 
    }
}

function register<T extends Processed<AnyModule>>(
    manager: ModuleManager,
    module: T,
): Result<void, void> {
    const { id, fullPath } = manager.getMetadata(module)!;

    const validModuleType = module.type >= 0 && module.type <= 1 << 10;
    assert.ok(
        validModuleType,
        `Found ${module.name} at ${fullPath}, which does not have a valid type`,
    );
    if (module.type === CommandType.Both || module.type === CommandType.Text) {
        module.alias?.forEach(a => manager.set(`${a}_A1`, fullPath));
    }
    return Result.wrap(() => manager.set(id, fullPath));
}
