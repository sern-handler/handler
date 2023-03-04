import { fromEvent, pipe, switchMap, take, tap } from 'rxjs';
import * as Files from '../utilities/readFile';
import { errTap, scanModule } from './observableHandling';
import { CommandType, type ModuleStore, SernError } from '../structures';
import { match } from 'ts-pattern';
import { Result } from 'ts-results-es';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import type { CommandModule } from '../../types/module';
import type { Processed } from '../../types/handler';
import type { ErrorHandling, Logging, ModuleManager } from '../contracts';
import { _const, err, ok } from '../utilities/functions';
import { defineAllFields } from './operators';
import SernEmitter from '../sernEmitter';
import type { EventEmitter } from 'node:events';

export function makeReadyEvent(
    [sEmitter,client, errorHandler,, moduleManager]: [SernEmitter, EventEmitter, ErrorHandling, Logging | undefined, ModuleManager],
    commandDir: string,
) {
    const readyOnce$ = fromEvent(client, 'ready').pipe(take(1));
    const parseCommandModules = pipe(
        switchMap(() => Files.buildData<CommandModule>(commandDir)),
        errTap(error => {
            sEmitter.emit('module.register', SernEmitter.failure(undefined, error));
        }),
        defineAllFields(),
    );
    return readyOnce$.pipe(
        parseCommandModules,
        scanModule({
            onFailure: module => {
                sEmitter.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure));
            },
            onSuccess: ({ module }) => {
                sEmitter.emit('module.register', SernEmitter.success(module));
                return module;
            },
        }),
    ).subscribe(module => {
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
        const set = Result.wrap(_const(manager.set(cb)));
        return set.ok ? ok() : err();
    };
    return match(mod as Processed<CommandModule>)
        .with({ type: CommandType.Text }, mod => {
            mod.alias?.forEach(a => insert(ms => ms.TextCommands.set(a, mod)));
            return insert(ms => ms.TextCommands.set(name, mod));
        })
        .with({ type: CommandType.Slash }, mod =>
            insert(ms => ms.ApplicationCommands[ApplicationCommandType.ChatInput].set(name, mod)),
        )
        .with({ type: CommandType.Both }, mod => {
            mod.alias?.forEach(a => insert(ms => ms.TextCommands.set(a, mod)));
            return insert(ms => ms.BothCommands.set(name, mod));
        })
        .with({ type: CommandType.CtxUser }, mod =>
            insert(ms => ms.ApplicationCommands[ApplicationCommandType.User].set(name, mod)),
        )
        .with({ type: CommandType.CtxMsg }, mod =>
            insert(ms => ms.ApplicationCommands[ApplicationCommandType.Message].set(name, mod)),
        )
        .with({ type: CommandType.Button }, mod =>
            insert(ms => ms.InteractionHandlers[ComponentType.Button].set(name, mod)),
        )
        .with({ type: CommandType.StringSelect }, mod =>
            insert(ms => ms.InteractionHandlers[ComponentType.StringSelect].set(name, mod)),
        )
        .with({ type: CommandType.MentionableSelect }, mod =>
            insert(ms => ms.InteractionHandlers[ComponentType.MentionableSelect].set(name, mod)),
        )
        .with({ type: CommandType.ChannelSelect }, mod =>
            insert(ms => ms.InteractionHandlers[ComponentType.ChannelSelect].set(name, mod)),
        )
        .with({ type: CommandType.UserSelect }, mod =>
            insert(ms => ms.InteractionHandlers[ComponentType.UserSelect].set(name, mod)),
        )
        .with({ type: CommandType.RoleSelect }, mod =>
            insert(ms => ms.InteractionHandlers[ComponentType.RoleSelect].set(name, mod)),
        )
        .with({ type: CommandType.Modal }, mod => insert(ms => ms.ModalSubmit.set(name, mod)))
        .otherwise(err);
}
