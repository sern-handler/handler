import {
    concat,
    concatMap,
    from,
    fromEvent,
    map,
    Observable,
    of,
    skip,
    take,
    throwError,
} from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import { controller } from '../sern';
import type { Result } from 'ts-results';
import { Err, Ok } from 'ts-results';
import type { Awaitable } from 'discord.js';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import type { Module } from '../structures/module';
import { match } from 'ts-pattern';
import { SernError } from '../structures/errors';
import type { DefinitelyDefined } from '../../types/handler';
import { CommandType, PluginType } from '../structures/enums';
import { errTap } from './observableHandling';

export const onReady = (wrapper: Wrapper) => {
    const { client, commands } = wrapper;
    const ready$ = fromEvent(client, 'ready').pipe(take(1), skip(1));
    const processCommandFiles$ = Files.buildData<Module>(commands).pipe(
        errTap(reason => {
            wrapper.sernEmitter?.emit('module.register', {
                type: 'failure',
                module: undefined,
                reason,
            });
        }),
        map(({ mod, absPath }) => {
            return {
                name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                description: mod?.description ?? '...',
                ...mod,
            };
        }),
    );
    const processPlugins$ = processCommandFiles$.pipe(
        concatMap(mod => {
            if (mod.type === CommandType.Autocomplete) {
                return throwError(
                    () =>
                        SernError.NonValidModuleType +
                        `. You cannot use command plugins and Autocomplete.`,
                );
            }
            const cmdPluginsRes =
                mod.plugins?.map(plug => {
                    return {
                        ...plug,
                        name: plug?.name ?? 'Unnamed Plugin',
                        description: plug?.description ?? '...',
                        execute: plug.execute(client, mod, controller),
                    };
                }) ?? [];
            return of({ mod, cmdPluginsRes });
        }),
    );

    (
        concat(ready$, processPlugins$) as Observable<{
            mod: DefinitelyDefined<Module, 'name' | 'description'>;
            cmdPluginsRes: {
                execute: Awaitable<Result<void, void>>;
                type: PluginType.Command;
                name: string;
                description: string;
            }[];
        }>
    )
        .pipe(
            concatMap(pl =>
                from(
                    Promise.all(
                        pl.cmdPluginsRes.map(async e => ({ ...e, execute: await e.execute })),
                    ),
                ).pipe(map(res => ({ ...pl, cmdPluginsRes: res }))),
            ),
        )
        .subscribe(({ mod, cmdPluginsRes }) => {
            const loadedPluginsCorrectly = cmdPluginsRes.every(res => res.execute.ok);
            if (loadedPluginsCorrectly) {
                const res = registerModule(mod);
                if (res.err) {
                    throw Error(SernError.NonValidModuleType);
                }
                wrapper.sernEmitter?.emit('module.register', { type: 'success', module: mod });
            } else {
                wrapper.sernEmitter?.emit('module.register', {
                    type: 'failure',
                    module: mod,
                    reason: SernError.PluginFailure,
                });
            }
        });
};

function registerModule(
    mod: DefinitelyDefined<Module, 'name' | 'description'>,
): Result<void, void> {
    const name = mod.name;
    return match<Module>(mod)
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
