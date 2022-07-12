import { EventsHandler } from './eventsHandler';
import { filter, fromEvent, map, Observable } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import type { Message } from 'discord.js';
import { filterCorrectModule, ignoreNonBot, mod$ } from './observableHandling';
import { fmt } from '../utilities/messageHelpers';
import Context from '../structures/context';
import * as Files from '../utilities/readFile';
import type { TextCommand } from '../structures/module';

class MessageHandler extends EventsHandler<{
    ctx: Context;
    args: ['text', string[]];
    mod: TextCommand;
}> {
    protected observable: Observable<Message>;
    public constructor(wrapper: Wrapper) {
        super(wrapper);
        this.observable = <Observable<Message>>fromEvent(wrapper.client, 'messageCreate');
    }
    protected init(): void {
        if (this.wrapper.defaultPrefix === undefined) return; //for now, just ignore if prefix doesnt exist
        const { defaultPrefix } = this.wrapper;
        this.observable
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
            )
            .subscribe(val => {});
    }

    protected setState(state: { ctx: Context; args: ['text', string[]]; mod: TextCommand }): void {}
}
