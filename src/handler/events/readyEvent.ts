import { concat, concatMap, from, fromEvent, map, Observable, of, skip, take } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type {
    HandlerCallback,
    ModuleHandlers,
    ModuleStates,
    ModuleType,
} from '../structures/modules/commands/moduleHandler';
import { CommandType } from '../sern';
import type { PluginType } from '../plugins/plugin';
import { Err, Ok, Result } from 'ts-results';
import type { Awaitable } from 'discord.js';
import type { Module } from '../structures/modules/commands/module';

export const onReady = (wrapper: Wrapper) => {
    const { client, commands } = wrapper;
    const ready$ = fromEvent(client, 'ready').pipe(take(1), skip(1));
    const processCommandFiles$ = Files.buildData(commands).pipe(
        map(({ mod, absPath }) => {
            const name = mod?.name ?? Files.fmtFileName(basename(absPath));
            if (mod?.name === undefined) {
                return { name, ...mod };
            }
            return mod;
        }),
    );
    const processPlugins$ = processCommandFiles$.pipe(
        concatMap((mod) => {
            const cmdPluginsRes = mod.plugins.map(plug => {
                return {
                    ...plug,
                    name: plug?.name ?? 'Unnamed Plugin',
                    execute: plug.execute(client, mod, {
                        next: () => Ok.EMPTY,
                        stop: () => Err.EMPTY,
                    }),
                };
            });
            return of({ mod, cmdPluginsRes });
        }),
    );

    (
        concat(ready$, processPlugins$) as Observable<{
            mod: Module;
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
                from(Promise.all(pl.cmdPluginsRes.map(async e => ({ ...e, execute: await e.execute })))).pipe(
                    map(res => ({ ...pl, cmdPluginsRes: res })),
                ),
            ),
        )
        .subscribe(({ mod, cmdPluginsRes }) => {
            const loadedPluginsCorrectly = cmdPluginsRes.every(res => res.execute.ok);
            if (loadedPluginsCorrectly) {
                registerModule(mod.name!, mod);
            } else {
                console.log(`Failed to load command ${mod.name!}`);
                console.log(mod);
            }
        });
};

function handler(name: string): ModuleHandlers {
    return {
        [CommandType.Text]: (mod) => {
            mod.alias.forEach(a => Files.TextCommandStore.aliases.set(a, mod));
            Files.TextCommandStore.text.set(name, mod);
        },
        [CommandType.Slash]: (mod) => {
            Files.ApplicationCommandStore[1].set(name, mod);
        },
        [CommandType.Both]: (mod) => {
            Files.BothCommand.set(name, mod);
            mod.alias.forEach(a => Files.TextCommandStore.aliases.set(a, mod));
        },
        [CommandType.MenuUser]: (mod) => {
            Files.ApplicationCommandStore[2].set(name, mod);
        },
        [CommandType.MenuMsg]: (mod) => {
            Files.ApplicationCommandStore[3].set(name, mod);
        },
        [CommandType.Button]: (mod) => {
            Files.MessageCompCommandStore[2].set(name, mod);
        },
        [CommandType.MenuSelect]: (mod) => {
            Files.MessageCompCommandStore[2].set(name, mod);
        },
    };
}

function registerModule<T extends ModuleType>(name: string, mod: ModuleStates[T]) {
    return (<HandlerCallback<CommandType>>handler(name)[mod.type])(mod);
}
