import { EventsHandler } from './eventsHandler';
import type Wrapper from '../structures/wrapper';
import { concatMap, fromEvent, Observable, map, take } from 'rxjs';
import * as Files from '../utilities/readFile';
import { errTap, processPlugins, resolvePlugins } from './observableHandling';
import { CommandType, PayloadType } from '../structures/enums';
import { SernError } from '../structures/errors';
import { match } from 'ts-pattern';
import { Result } from 'ts-results-es';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import type { CommandModule } from '../../types/module';
import type { DefinedCommandModule, DefinedEventModule } from '../../types/handler';
import type { ModuleManager } from '../contracts';
import type { ModuleStore } from '../structures/moduleStore';
import { _const, err, nameOrFilename, ok } from '../utilities/functions';

export default class ReadyHandler extends EventsHandler<{
    mod: DefinedCommandModule;
    absPath: string;
}> {
    protected discordEvent!: Observable<{ mod: CommandModule; absPath: string }>;
    constructor(wrapper: Wrapper) {
        super(wrapper);
        const ready$ = fromEvent(this.client, 'ready').pipe(take(1));
        this.discordEvent = ready$.pipe(
            concatMap(() =>
                Files.buildData<CommandModule>(wrapper.commands).pipe(
                    errTap(reason =>
                        this.emitter.emit('module.register', {
                            type: PayloadType.Failure,
                            module: undefined,
                            reason,
                        }),
                    ),
                ),
            ),
        );
        this.init();
        this.payloadSubject
            .pipe(
                concatMap(processPlugins),
                concatMap(resolvePlugins),
            ).subscribe(payload => {
                const allPluginsSuccessful = payload.pluginRes.every(({ execute }) => execute.ok);
                if (allPluginsSuccessful) {
                    const res = registerModule(this.modules, payload.mod);
                    if (res.err) {
                        this.crashHandler.crash(Error(SernError.InvalidModuleType));
                    }
                    this.emitter.emit('module.register', {
                        type: PayloadType.Success,
                        module: payload.mod,
                    });
                } else {
                    this.emitter.emit('module.register', {
                        type: PayloadType.Failure,
                        module: payload.mod,
                        reason: SernError.PluginFailure,
                    });
                }
            });
    }
    private static intoDefinedModule({ absPath, mod }: { absPath: string; mod: CommandModule }): {
        absPath: string;
        mod: DefinedCommandModule;
    } {
        return {
            absPath,
            mod: {
                name: nameOrFilename(mod.name, absPath),
                description: mod?.description ?? '...',
                ...mod,
            },
        };
    }

    protected init() {
        this.discordEvent.pipe(map(ReadyHandler.intoDefinedModule)).subscribe({
            next: value => this.setState(value),
            complete: () => this.payloadSubject.unsubscribe(),
        });
    }
    protected setState(state: { absPath: string; mod: DefinedCommandModule }): void {
        this.payloadSubject.next(state);
    }
}

function registerModule(manager: ModuleManager, mod: DefinedCommandModule | DefinedEventModule): Result<void, void> {
    const name = mod.name;
    const insert = (cb: (ms: ModuleStore) => void) => {
        const set = Result.wrap(_const(manager.set(cb)));
        return set.ok ? ok() : err();
    };
    return match<DefinedCommandModule | DefinedEventModule>(mod)
        .with({ type: CommandType.Text }, mod => {
            mod.alias?.forEach(a => insert(ms => ms.TextCommands.set(a, mod)));
            return insert(ms => ms.TextCommands.set(name, mod));
        })
        .with({ type: CommandType.Slash }, mod =>
            insert(ms => ms.ApplicationCommands[ApplicationCommandType.ChatInput].set(name, mod))
        )
        .with({ type: CommandType.Both }, mod => {
            mod.alias?.forEach(a => insert(ms => ms.TextCommands.set(a, mod)));
            return insert( ms => ms.BothCommands.set(name, mod));
        })
        .with({ type: CommandType.CtxUser }, mod =>
             insert(ms => ms.ApplicationCommands[ApplicationCommandType.User].set(name, mod))
        )
        .with({ type: CommandType.CtxMsg }, mod =>
             insert(ms => ms.ApplicationCommands[ApplicationCommandType.Message].set(name, mod))
        )
        .with({ type: CommandType.Button }, mod =>
             insert(ms => ms.InteractionHandlers[ComponentType.Button].set(name, mod))
        )
        .with({ type: CommandType.StringSelect }, mod =>
             insert(ms => ms.InteractionHandlers[ComponentType.StringSelect].set(name, mod))
        )
        .with( { type: CommandType.MentionableSelect }, mod =>
            insert (ms => ms.InteractionHandlers[ComponentType.MentionableSelect].set(name, mod))
        )
        .with( { type: CommandType.ChannelSelect }, mod =>
            insert ( ms => ms.InteractionHandlers[ComponentType.ChannelSelect].set(name, mod))
        )
        .with( { type: CommandType.UserSelect }, mod =>
            insert ( ms => ms.InteractionHandlers[ComponentType.UserSelect].set(name, mod))
        )
        .with( { type: CommandType.RoleSelect}, mod =>
            insert ( ms => ms.InteractionHandlers[ComponentType.RoleSelect].set(name, mod))
        )
        .with({ type: CommandType.Modal }, mod =>
            insert(ms => ms.ModalSubmit.set(name, mod))
        )
        .otherwise(err);
}
