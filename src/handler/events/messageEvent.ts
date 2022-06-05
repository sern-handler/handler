import type { Message } from 'discord.js';
import { concatMap, from, fromEvent, map, Observable, of } from 'rxjs';
import type { Args } from '../..';
import { controller } from '../sern';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import { fmt } from '../utilities/messageHelpers';
import * as Files from '../utilities/readFile';
import { filterCorrectModule, ignoreNonBot } from './observableHandling';
import { CommandType } from '../structures/enums';
import { SernError } from '../structures/errors';

export const onMessageCreate = (wrapper: Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    if (defaultPrefix === undefined) return;

    const messageEvent$ = <Observable<Message>>fromEvent(client, 'messageCreate');

    const processMessage$ = messageEvent$.pipe(
        ignoreNonBot(defaultPrefix),
        map(message => {
            const [prefix, ...rest] = fmt(message, defaultPrefix);
            return {
                ctx: Context.wrap(message),
                args: <['text', string[]]>['text', rest],
                mod:
                    Files.TextCommands.text.get(prefix) ??
                    Files.BothCommands.get(prefix) ??
                    Files.TextCommands.aliases.get(prefix),
            };
        }),
    );
    const ensureModuleType$ = processMessage$.pipe(
        concatMap(payload =>
            of(payload.mod).pipe(
                filterCorrectModule(CommandType.Text),
                map(mod => ({ ...payload, mod })),
            ),
        ),
    );

    const processEventPlugins$ = ensureModuleType$.pipe(
        concatMap(({ ctx, args, mod }) => {
            const res = Promise.all(
                mod.onEvent.map(ePlug => {
                    return ePlug.execute([ctx, args], controller);
                }),
            );
            return from(res).pipe(map(res => ({ mod, ctx, args, res })));
        }),
    );

    processEventPlugins$.subscribe({
        next({ mod, ctx, args, res }) {
            if (res.every(pl => pl.ok)) {
                Promise.resolve(mod.execute(ctx, args)).then(() => {
                    wrapper.sernEmitter?.emit('module.activate', { success: true, module: mod! });
                });
            } else {
                wrapper.sernEmitter?.emit('module.activate', {
                    success: false,
                    module: mod!,
                    reason: SernError.PluginFailure,
                });
            }
        },
        error(e) {
            wrapper.sernEmitter?.emit('error', e);
        },
    });
};
