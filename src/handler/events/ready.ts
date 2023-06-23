import { ObservableInput, fromEvent, take } from 'rxjs';
import { CommandType } from '../../core/structures';
import { SernError } from '../../core/structures/errors';
import { Result } from 'ts-results-es';
import { ModuleManager } from '../../core/contracts';
import { SernEmitter } from '../../core';
import { Processed, DependencyList } from '../types';
import { buildModules, callInitPlugins } from './generic';
import { AnyModule } from '../../core/types/modules';
import * as assert from 'node:assert';

export function startReadyEvent(
    [sEmitter, , , moduleManager, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    const ready$ = fromEvent(client!, 'ready').pipe(take(1));
    return ready$
        .pipe(
            buildModules<Processed<AnyModule>>(allPaths, moduleManager),
            callInitPlugins({
                onStop: module => {
                    sEmitter.emit(
                        'module.register',
                        SernEmitter.failure(module, SernError.PluginFailure),
                    );
                },
                onNext: ({ module }) => {
                    sEmitter.emit('module.register', SernEmitter.success(module));
                    return module;
                },
            }),
        )
        .subscribe(module => {
            const result = registerModule(moduleManager, module);
            if (result.err) {
                throw Error(SernError.InvalidModuleType + ' ' + result.val);
            }
        });
}

function registerModule<T extends Processed<AnyModule>>(
    manager: ModuleManager,
    module: T,
): Result<void, void> {
    const { id, fullPath } = manager.getMetadata(module)!;

    assert.ok(
        module.type >= 0 && module.type <= 1 << 10,
        `Found ${module.name} at ${fullPath}, which does not have a valid type`,
    );
    if (module.type === CommandType.Both || module.type === CommandType.Text) {
        module.alias?.forEach(a => manager.set(`${a}_A1`, fullPath));
    }
    return Result.wrap(() => manager.set(id, fullPath));
}
