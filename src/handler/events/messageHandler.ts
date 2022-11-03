import { EventsHandler } from './eventsHandler';
import { catchError, concatMap, from, fromEvent, map, Observable, of, switchMap, tap } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import type { Message } from 'discord.js';
import { executeModule, ignoreNonBot, isOneOfCorrectModules } from './observableHandling';
import { fmt } from '../utilities/messageHelpers';
import Context from '../structures/context';
import * as Files from '../utilities/readFile';
import { CommandType, PayloadType } from '../structures/enums';
import { asyncResolveArray } from '../utilities/asyncResolveArray';
import { controller } from '../sern';
import type { TextCommand } from '../../types/module';
import { handleError } from '../contracts/errorHandling';
import type { ModuleManager } from '../contracts';

export default class MessageHandler extends EventsHandler<{
    ctx: Context;
    args: ['text', string[]];
    mod: TextCommand;
}> {
    protected discordEvent: Observable<Message>;
    private moduleManager: ModuleManager;
    public constructor(protected wrapper: Wrapper) {
        super(wrapper);
        this.moduleManager = wrapper.containerConfig.get('@sern/modules')[0] as ModuleManager;
        this.discordEvent = <Observable<Message>>fromEvent(this.client, 'messageCreate');
        this.init();
        this.payloadSubject
            .pipe(
                switchMap(({ mod, ctx, args }) => {
                    const res = asyncResolveArray(
                        mod.onEvent.map(ePlug => {
                            return ePlug.execute([ctx, args], controller);
                        }),
                    );
                    const execute = () => {
                        return mod.execute(ctx, args);
                    };
                    //resolves the promise and re-emits it back into source
                    return from(res).pipe(map(res => ({ mod, execute, res })));
                }),
                concatMap(payload => executeModule(wrapper, payload)),
                catchError(handleError(this.crashHandler, this.logger)),
            )
            .subscribe();
    }

    protected init(): void {
        if (this.wrapper.defaultPrefix === undefined) return; //for now, just ignore if prefix doesn't exist
        const { defaultPrefix } = this.wrapper;
        this.discordEvent
            .pipe(
                ignoreNonBot(this.wrapper.defaultPrefix),
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
                concatMap(element =>
                    of(element.mod).pipe(
                        isOneOfCorrectModules(CommandType.Text),
                        map(mod => ({ ...element, mod })),
                    ),
                ),
            )
            .subscribe({
                next: value => this.setState(value),
                error: reason =>
                    this.emitter?.emit('error', { type: PayloadType.Failure, reason }),
            });
    }

    protected setState(state: { ctx: Context; args: ['text', string[]]; mod: TextCommand }) {
        this.payloadSubject.next(state);
    }
}
