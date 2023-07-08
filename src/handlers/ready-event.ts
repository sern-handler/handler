import { ObservableInput, fromEvent, switchMap, take } from 'rxjs';
import { CommandType } from '../core/structures';
import { DependencyList, SernError } from '../core/_internal';
import { Result } from 'ts-results-es';
import { ModuleManager } from '../core/contracts';
import { buildModules, callInitPlugins } from './_internal';
import { AnyModule } from '../core/types/modules';
import * as assert from 'node:assert';
import * as util from 'node:util';
import { Processed } from '../core/types/plugins';

export function startReadyEvent(
    [sEmitter, , , moduleManager, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    const ready$ = fromEvent(client!, 'ready').pipe(take(1));
    return ready$
        .pipe(
            switchMap(() => buildModules<AnyModule>(allPaths,moduleManager)),
            callInitPlugins(sEmitter),
        )
        .subscribe(module => {
            registerModule(moduleManager, module)
                .expect(SernError.InvalidModuleType + ' ' + util.inspect(module))
        });
}

function registerModule<T extends Processed<AnyModule>>(
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
