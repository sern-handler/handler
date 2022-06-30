import { concat, concatMap, from, fromEvent, map, Observable, of, skip, take } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { Result } from 'ts-results';
import { Err, Ok } from 'ts-results';
import type { Awaitable } from 'discord.js';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import type { CommandModule } from '../structures/module';
import { match } from 'ts-pattern';
import { SernError } from '../structures/errors';
import type { DefinedCommandModule } from '../../types/handler';
import { CommandType, PluginType, PayloadType } from '../structures/enums';
import { errTap } from './observableHandling';
import { processCommandPlugins } from './userDefinedEventsHandling';

export function onReady(wrapper: Wrapper) {
    const { client, commands } = wrapper;
    const ready$ = fromEvent(client, 'ready').pipe(take(1), skip(1));

    // Using sernModule function already checks if module is not EventModule
    const processCommandFiles$ = Files.buildData<CommandModule>(commands).pipe(
        errTap(reason => {
            wrapper.sernEmitter?.emit('module.register', {
                type: PayloadType.Failure,
                module: undefined,
                reason,
            });
        }),
        map(({ mod, absPath }) => {
            return {
                absPath,
                mod: <DefinedCommandModule>{
                    name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                    description: mod?.description ?? '...',
                    ...mod,
                },
            };
        }),
    );
    const processPlugins$ = processCommandFiles$.pipe(
        concatMap(payload => {
            const cmdPluginRes = processCommandPlugins(wrapper, payload);
            return of({ mod: payload.mod, cmdPluginRes });
        }),
    );

    (
        concat(ready$, processPlugins$) as Observable<{
            mod: DefinedCommandModule;
            cmdPluginRes: {
                execute: Awaitable<Result<void, void>>;
                type: PluginType.Command;
                name: string;
                description: string;
            }[];
        }>
    )
        .pipe(
            concatMap(pl => {
                return from(
                    //refactor, this allocates too many objects
                    Promise.all(
                        pl.cmdPluginRes.map(async e => ({ ...e, execute: await e.execute })),
                    ),
                ).pipe(map(res => ({ ...pl, cmdPluginsRes: res })));
            }),
        )
        .subscribe(({ mod, cmdPluginsRes }) => {
            const loadedPluginsCorrectly = cmdPluginsRes.every(({ execute }) => execute.ok);
            if (loadedPluginsCorrectly) {
                const res = registerModule(mod);
                if (res.err) {
                    throw Error(SernError.NonValidModuleType);
                }
                wrapper.sernEmitter?.emit('module.register', { type: PayloadType.Success, module: mod });
            } else {
                wrapper.sernEmitter?.emit('module.register', {
                    type: PayloadType.Failure,
                    module: mod,
                    reason: SernError.PluginFailure,
                });
            }
        });
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
            Files.ApplicationCommands[ComponentType.Button].set(name, mod);
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
