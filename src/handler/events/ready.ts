import { Subscription, fromEvent, of, take } from 'rxjs';
import { callInitPlugins } from './observableHandling';
import { CommandType, SernError } from '../../core/structures';
import { Result } from 'ts-results-es';
import type { CommandModule } from '../../types/module';
import type { Processed, ServerlessDependencyList, WebsocketDependencyList } from '../../types/handler';
import type { ErrorHandling, Logging, ModuleManager } from '../../core/contracts';
import SernEmitter from '../../core/sernEmitter';
import type { EventEmitter } from 'node:events';
import { DispatchType, PlatformStrategy, ServerlessStrategy, WebsocketStrategy } from '../../core';
import { sernMeta } from '../../commands';
import { buildModules } from './generic';

/**
  * @overload
  */
export function makeReadyEvent(
    dependencies: ServerlessDependencyList,
    commandDir: string,
    platform: ServerlessStrategy

): Subscription
export function makeReadyEvent(
    dependencies: WebsocketDependencyList,
    commandDir: string,
    platform: WebsocketStrategy

): Subscription

export function makeReadyEvent(
    [sEmitter, errorHandler, , moduleManager, client]: [
        SernEmitter,
        ErrorHandling,
        Logging | undefined,
        ModuleManager,
        EventEmitter? 
    ],
    commandDir: string,
    platform: PlatformStrategy
) {
    const ready$ = platform.type === DispatchType.Serverless 
        ? of(null)
        : fromEvent(client!, platform.eventNames[2]).pipe(take(1));
    return ready$
        .pipe(
            buildModules(commandDir, sEmitter),
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
            const result = registerModule(moduleManager, module as Processed<CommandModule>);
            if (result.err) {
                errorHandler.crash(Error(SernError.InvalidModuleType));
            }
        });
}

function registerModule<T extends Processed<CommandModule>>(
    manager: ModuleManager,
    module: T,
): Result<void, void> {
    const { id, fullPath } = module[sernMeta]; 
    if(module.type === CommandType.Both || module.type === CommandType.Text) {
        module.alias?.forEach(a => manager.set(`${a}__A0` , fullPath))
    }
    return Result.wrap(() => manager.set(id, fullPath))
}
