import { EventsHandler } from './eventsHandler';
import type Wrapper from '../../structures/wrapper';
import { concatMap, fromEvent, Observable, map } from 'rxjs';
import type { CommandModule } from '../../structures/module';
import * as Files from '../../utilities/readFile';
import { errTap } from '../observableHandling';
import type { DefinedCommandModule } from '../../../types/handler';
import { basename } from 'path';

export default class ReadyHandler extends EventsHandler<{
    mod: DefinedCommandModule;
    absPath: string;
}> {
    protected observable!: Observable<{ mod: CommandModule; absPath: string }>;
    constructor(wrapper: Wrapper) {
        super(wrapper);
        const ready$ = fromEvent(this.wrapper.client, 'ready');
        this.observable = ready$.pipe(
            concatMap(() =>
                Files.buildData<CommandModule>(this.wrapper.commands).pipe(
                    errTap(e => {
                        this.wrapper.sernEmitter?.emit('error', e);
                    }),
                ),
            ),
        );
        this.init();
        this.payloadSubject.subscribe({
            next: value => {
                console.log(value);
            },
            complete: () => {
                console.log('sdfsd');
            },
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
    protected init() {
        this.observable
            .pipe(map(ReadyHandler.intoDefinedModule))
            .subscribe(value => this.setState(value));
    }

    protected setState(state: { absPath: string; mod: DefinedCommandModule }): void {
        this.payloadSubject.next(state);
    }
}
