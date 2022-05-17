import { concat, concatMap, from, fromEvent, map, Observable, of, skip, take } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import { CommandType, controller } from '../sern';
import type { PluginType } from '../plugins/plugin';
import type { Result } from 'ts-results';
import type { Awaitable } from 'discord.js';
import type { Module } from '../structures/module';
import { match } from 'ts-pattern';
import { ApplicationCommandType, ComponentType } from 'discord.js';
import { Err, Ok } from 'ts-results';
import { SernError } from '../structures/errors';
import type { DefinitelyDefined } from '../../types/handler';

export const onReady = (wrapper: Wrapper) => {
    const { client, commands } = wrapper;
    const ready$ = fromEvent(client, 'ready').pipe(take(1), skip(1));
    const processCommandFiles$ = Files.buildData(commands).pipe(
        map(({ mod, absPath }) => {
            if (mod?.name === undefined) {
                const name = Files.fmtFileName(basename(absPath));
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
                    execute: plug.execute(client, mod, controller),
                };
            });
            return of({ mod, cmdPluginsRes });
        }),
    );

    (
        concat(ready$, processPlugins$) as Observable<{
            mod: DefinitelyDefined<Module, { name : string }>;
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
                const res = registerModule(mod);
                if(res.err) {
                    throw Error(SernError.NonValidModuleType);
                }
            } else {
                console.log(`Failed to load command ${mod.name!}`);
                console.log(mod);
            }
        });
};

function registerModule(mod: DefinitelyDefined<Module, { name: string }>) : Result<void, void> {
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
        .otherwise(() => Err.EMPTY);
}
