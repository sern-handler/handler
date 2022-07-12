import { EventsHandler } from './eventsHandler';
import type Wrapper from '../structures/wrapper';
import { concatMap, fromEvent, Observable, map, take, of } from 'rxjs';
import type { CommandModule } from '../structures/module';
import * as Files from '../utilities/readFile';
import { errTap } from './observableHandling';
import type { DefinedCommandModule } from '../../types/handler';
import { basename } from 'path';
import { PayloadType } from '../structures/enums';
import { processCommandPlugins } from './userDefinedEventsHandling';

export default class ReadyHandler extends EventsHandler<{
    mod: DefinedCommandModule;
    absPath: string;
}> {
    protected observable!: Observable<{ mod: CommandModule; absPath: string }>;
    constructor(wrapper: Wrapper) {
        super(wrapper);
        const ready$ = fromEvent(this.wrapper.client, 'ready').pipe(take(1));
        this.observable = ready$.pipe(
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
        this.payloadSubject.pipe(concatMap(payload => this.processPlugins(payload))).subscribe();
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

    private processPlugins(payload: { mod: DefinedCommandModule; absPath: string }) {
        const cmdPluginRes = processCommandPlugins(this.wrapper, payload);
        return of({ mod: payload.mod, cmdPluginRes });
    }

    protected init() {
        this.observable.pipe(map(ReadyHandler.intoDefinedModule)).subscribe({
            next: value => this.setState(value),
            complete: () => this.payloadSubject.unsubscribe(),
        });
    }
    protected setState(state: { absPath: string; mod: DefinedCommandModule }): void {
        this.payloadSubject.next(state);
    }
}
