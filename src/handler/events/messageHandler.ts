import { EventsHandler } from './eventsHandler';
import { catchError, concatMap, EMPTY, fromEvent, map, Observable, of } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import type { Message } from 'discord.js';
import { executeModule, ignoreNonBot, makeModuleExecutor } from './observableHandling';
import { fmt } from '../utilities/messageHelpers';
import type { CommandModule, Module, TextCommand } from '../../types/module';
import { handleError } from '../contracts/errorHandling';
import type { ModuleStore } from '../structures/moduleStore';
import { contextArgs, dispatchCommand } from './dispatchers';
import { SernError } from '../structures/errors';
import SernEmitter from '../sernEmitter';
import type { Processed } from '../../types/handler';

export default class MessageHandler extends EventsHandler<{
    module: Processed<Module>;
    args: unknown[];
}> {
    protected discordEvent: Observable<Message>;

    public constructor(protected wrapper: Wrapper) {
        super(wrapper);
        this.discordEvent = <Observable<Message>>fromEvent(this.client, 'messageCreate');
        this.init();
        this.payloadSubject
            .pipe(
                makeModuleExecutor(module => {
                    this.emitter.emit(
                        'module.activate',
                        SernEmitter.failure(module, SernError.PluginFailure),
                    );
                }),
                concatMap(payload => executeModule(this.emitter, payload)),
                catchError(handleError(this.crashHandler, this.logger)),
            )
            .subscribe();
    }

    protected init(): void {
        if (this.wrapper.defaultPrefix === undefined) return; //for now, just ignore if prefix doesn't exist
        const { defaultPrefix } = this.wrapper;
        const get = (cb: (ms: ModuleStore) => Processed<CommandModule> | undefined) => {
            return this.modules.get(cb);
        };
        this.discordEvent
            .pipe(
                ignoreNonBot(this.wrapper.defaultPrefix),
                //This concatMap checks if module is undefined, and if it is, do not continue.
                // Synonymous to filterMap, but I haven't thought of a generic implementation for filterMap yet
                concatMap(message => {
                    const [prefix, ...rest] = fmt(message, defaultPrefix);
                    const module = get(
                        ms => ms.TextCommands.get(prefix) ?? ms.BothCommands.get(prefix),
                    );
                    if (module === undefined) {
                        return EMPTY;
                    }
                    const payload = {
                        args: contextArgs(message, rest),
                        module,
                    };
                    return of(payload);
                }),
                map(({ args, module }) => dispatchCommand(module as Processed<TextCommand>, args)),
            )
            .subscribe({
                next: value => this.setState(value),
                error: reason => this.emitter.emit('error', SernEmitter.failure(reason)),
            });
    }

    protected setState(state: { module: Processed<Module>; args: unknown[] }) {
        this.payloadSubject.next(state);
    }
}
