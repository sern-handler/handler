import { EventsHandler } from './eventsHandler';
import type Wrapper from '../structures/wrapper';
import { concatMap, fromEvent, type Observable, take } from 'rxjs';
import * as Files from '../utilities/readFile';
import { errTap, scanModule } from './observableHandling';
import { CommandType } from '../structures/enums';
import { SernError } from '../structures/errors';
import { match } from 'ts-pattern';
import { Result } from 'ts-results-es';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import type { CommandModule } from '../../types/module';
import type { Processed } from '../../types/handler';
import type { ModuleManager } from '../contracts';
import type { ModuleStore } from '../structures/moduleStore';
import { _const, err, ok } from '../utilities/functions';
import { defineAllFields } from './operators';
import SernEmitter from '../sernEmitter';

export default class ReadyHandler extends EventsHandler<{
    module: Processed<CommandModule>;
    absPath: string;
}> {
    protected discordEvent!: Observable<{ module: CommandModule; absPath: string }>;
    constructor(wrapper: Wrapper) {
        super(wrapper);
        const ready$ = fromEvent(this.client, 'ready').pipe(take(1));
        this.discordEvent = ready$.pipe(
            concatMap(() =>
                Files.buildData<CommandModule>(wrapper.commands).pipe(
                    errTap(reason => {
                      this.emitter.emit('module.register', SernEmitter.failure(undefined, reason));
                    }))
            ),
        );
        this.init();
        this.payloadSubject
            .pipe(
                concatMap(
                    scanModule({
                    onFailure: module => {
                        this.emitter.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure));
                    },
                    onSuccess: ( {module} ) => {
                        this.emitter.emit('module.register', SernEmitter.success(module));
                        return module;
                    }
                })),
            )
            .subscribe(module => {
                const res = registerModule(this.modules, module as Processed<CommandModule>);
                if (res.err) {
                    this.crashHandler.crash(Error(SernError.InvalidModuleType));
                }
            });
    }

    protected init() {
        this.discordEvent.pipe(
            defineAllFields(),
        ).subscribe({
            next: value => this.setState(value),
            complete: () => this.payloadSubject.unsubscribe(),
        });
    }
    protected setState(state: { absPath: string; module: Processed<CommandModule> }): void {
        this.payloadSubject.next(state);
    }
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
