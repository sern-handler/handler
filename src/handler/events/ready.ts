import { Subscription, fromEvent, map, of, pipe, switchMap, take } from 'rxjs';
import * as Files from '../../core/module-loading';
import { callInitPlugins } from './observableHandling';
import { CommandType, type ModuleStore, SernError } from '../../core/structures';
import { Result } from 'ts-results-es';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import type { CommandModule } from '../../types/module';
import type { Processed } from '../../types/handler';
import type { ErrorHandling, Logging, ModuleManager } from '../../core/contracts';
import { err, ok } from '../../core/functions';
import { errTap, fillDefaults } from '../../core/operators';
import SernEmitter from '../../core/sernEmitter';
import type { EventEmitter } from 'node:events';
import { DispatchType, PlatformStrategy, ServerlessStrategy, WebsocketStrategy } from '../../core';

function buildCommandModules(commandDir: string, sernEmitter: SernEmitter) {
    return pipe(
        switchMap(() => Files.buildModuleStream<CommandModule>(commandDir)),
        errTap(error => {
            sernEmitter.emit('module.register', SernEmitter.failure(undefined, error));
        }),
        map(fillDefaults),
    );
}

/**
  * @overload
  */
export function makeReadyEvent(
     dependencies: [
        SernEmitter,
        ErrorHandling,
        Logging | undefined,
        ModuleManager,
    ],
    commandDir: string,
    platform: ServerlessStrategy

): Subscription
export function makeReadyEvent(
     dependencies: [
        SernEmitter,
        ErrorHandling,
        Logging | undefined,
        ModuleManager,
        EventEmitter
    ],
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
            buildCommandModules(commandDir, sEmitter),
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
    mod: T,
): Result<void, void> {
    const name = mod.name;
    const insert = (cb: (ms: ModuleStore) => void) => {
        const set = Result.wrap(() => manager.set(cb));
        return set.ok ? ok() : err();
    };
    switch (mod.type) {
        case CommandType.Text: {
            mod.alias?.forEach(a => insert(ms => ms.TextCommands.set(a, mod)));
            return insert(ms => ms.TextCommands.set(name, mod));
        }
        case CommandType.Slash:
            return insert(ms =>
                ms.ApplicationCommands[ApplicationCommandType.ChatInput].set(name, mod),
            );
        case CommandType.Both: {
            mod.alias?.forEach(a => insert(ms => ms.TextCommands.set(a, mod)));
            return insert(ms => ms.BothCommands.set(name, mod));
        }
        case CommandType.CtxUser:
            return insert(ms => ms.ApplicationCommands[ApplicationCommandType.User].set(name, mod));
        case CommandType.CtxMsg:
            return insert(ms =>
                ms.ApplicationCommands[ApplicationCommandType.Message].set(name, mod),
            );
        case CommandType.Button:
            return insert(ms => ms.InteractionHandlers[ComponentType.Button].set(name, mod));
        case CommandType.StringSelect:
            return insert(ms => ms.InteractionHandlers[ComponentType.StringSelect].set(name, mod));
        case CommandType.MentionableSelect:
            return insert(ms =>
                ms.InteractionHandlers[ComponentType.MentionableSelect].set(name, mod),
            );
        case CommandType.UserSelect:
            return insert(ms => ms.InteractionHandlers[ComponentType.UserSelect].set(name, mod));
        case CommandType.ChannelSelect:
            return insert(ms => ms.InteractionHandlers[ComponentType.ChannelSelect].set(name, mod));
        case CommandType.RoleSelect:
            return insert(ms => ms.InteractionHandlers[ComponentType.RoleSelect].set(name, mod));
        case CommandType.Modal:
            return insert(ms => ms.ModalSubmit.set(name, mod));
        default:
            return err();
    }
}
