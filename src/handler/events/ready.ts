import { ObservableInput, fromEvent, take } from 'rxjs';
import { CommandType } from '../../core/structures';
import { SernError } from '../../core/structures/errors';
import { Result } from 'ts-results-es';
import { ModuleManager } from '../../core/contracts';
import { SernEmitter } from '../../core';
import { sernMeta } from '../commands';
import { Processed, DependencyList } from '../types';
import { buildModules, callInitPlugins } from './generic';
import { AnyModule } from '../../core/types/modules';

export function startReadyEvent(
    [sEmitter,,, moduleManager, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    const ready$ = fromEvent(client!, 'ready').pipe(take(1));
    return ready$
        .pipe(
            buildModules(allPaths, sEmitter),
            callInitPlugins({
                onStop: module => {
                    sEmitter.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure));
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
                throw Error(SernError.InvalidModuleType);
            }
        });
}

function registerModule<T extends Processed<AnyModule>>(
    manager: ModuleManager,
    module: T,
): Result<void, void> {
    const { id, fullPath } = module[sernMeta];
    if (module.type === CommandType.Both 
        || module.type === CommandType.Text
    ) {
        module.alias?.forEach(a => manager.set(`${a}__A0`, fullPath));
    }
    return Result.wrap(() => manager.set(id, fullPath));
}


