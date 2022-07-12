import { EventsHandler } from './eventsHandler';
import type Wrapper from '../structures/wrapper';
import { concatMap, fromEvent, Observable, map, take, of, from, toArray, switchMap } from 'rxjs';
import type { CommandModule } from '../structures/module';
import * as Files from '../utilities/readFile';
import { errTap } from './observableHandling';
import type { DefinedCommandModule } from '../../types/handler';
import { basename } from 'path';
import { CommandType, PayloadType, PluginType } from '../structures/enums';
import { processCommandPlugins } from './userDefinedEventsHandling';
import type { Awaitable } from 'discord.js';
import type { Result } from 'ts-results';
import { SernError } from '../structures/errors';
import { match } from 'ts-pattern';
import { Err, Ok } from 'ts-results';
import { ApplicationCommandType, ComponentType } from 'discord.js';

export default class ReadyHandler extends EventsHandler<{
    mod: DefinedCommandModule;
    absPath: string;
}> {
    protected discordEvent!: Observable<{ mod: CommandModule; absPath: string }>;
    constructor(wrapper: Wrapper) {
        super(wrapper);
        const ready$ = fromEvent(this.wrapper.client, 'ready').pipe(take(1));
        this.discordEvent = ready$.pipe(
            concatMap(() =>
                Files.buildData<CommandModule>(this.wrapper.commands).pipe(
                    errTap(reason =>
                        wrapper.sernEmitter?.emit('module.register', {
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
                concatMap(payload => this.processPlugins(payload)),
                concatMap(payload => this.resolvePlugins(payload)),
            )
            .subscribe(payload => {
                const allPluginsSuccessful = payload.pluginRes.every(({ execute }) => execute.ok);
                if (allPluginsSuccessful) {
                    const res = registerModule(payload.mod);
                    if (res.err) {
                        throw Error(SernError.NonValidModuleType);
                    }
                    wrapper.sernEmitter?.emit('module.register', {
                        type: PayloadType.Success,
                        module: payload.mod,
                    });
                } else {
                    wrapper.sernEmitter?.emit('module.register', {
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
                name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                description: mod?.description ?? '...',
                ...mod,
            },
        };
    }

    private resolvePlugins({
        mod,
        cmdPluginRes,
    }: {
        mod: DefinedCommandModule;
        cmdPluginRes: {
            name: string;
            description: string;
            execute: Awaitable<Result<void, void>>;
            type: PluginType.Command;
        }[];
    }) {
        if (mod.plugins.length === 0) {
            return of({ mod, pluginRes: [] });
        }
        // modules with no event plugins are ignored in the previous
        return from(cmdPluginRes).pipe(
            switchMap(pl =>
                from(pl.execute).pipe(
                    map(execute => ({ ...pl, execute })),
                    toArray(),
                ),
            ),
            map(pluginRes => ({ mod, pluginRes })),
        );
    }

    private processPlugins(payload: { mod: DefinedCommandModule; absPath: string }) {
        const cmdPluginRes = processCommandPlugins(this.wrapper, payload);
        return of({ mod: payload.mod, cmdPluginRes });
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

function registerModule(mod: DefinedCommandModule): Result<void, void> {
    const name = mod.name;
    return match<DefinedCommandModule>(mod)
        .with({ type: CommandType.Text }, mod => {
            mod.alias?.forEach(a => Files.TextCommands.aliases.set(a, mod));
            Files.TextCommands.text.set(name, mod);
            return Ok.EMPTY;
        })
        .with({ type: CommandType.Slash }, mod => {
            Files.ApplicationCommands[ApplicationCommandType.ChatInput].set(name, mod);
            return Ok.EMPTY;
        })
        .with({ type: CommandType.Both }, mod => {
            Files.BothCommands.set(name, mod);
            mod.alias?.forEach(a => Files.TextCommands.aliases.set(a, mod));
            return Ok.EMPTY;
        })
        .with({ type: CommandType.MenuUser }, mod => {
            Files.ApplicationCommands[ApplicationCommandType.User].set(name, mod);
            return Ok.EMPTY;
        })
        .with({ type: CommandType.MenuMsg }, mod => {
            Files.ApplicationCommands[ApplicationCommandType.Message].set(name, mod);
            return Ok.EMPTY;
        })
        .with({ type: CommandType.Button }, mod => {
            Files.MessageCompCommands[ComponentType.Button].set(name, mod);
            return Ok.EMPTY;
        })
        .with({ type: CommandType.MenuSelect }, mod => {
            Files.MessageCompCommands[ComponentType.SelectMenu].set(name, mod);
            return Ok.EMPTY;
        })
        .with({ type: CommandType.Modal }, mod => {
            Files.ModalSubmitCommands.set(name, mod);
            return Ok.EMPTY;
        })
        .otherwise(() => Err.EMPTY);
}
