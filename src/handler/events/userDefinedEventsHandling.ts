import { fromEvent, map } from 'rxjs';
import * as Files from '../utilities/readFile';
import { buildData } from '../utilities/readFile';
import { controller } from '../sern';
import type {
    DefinedCommandModule,
    DefinedEventModule, Dependencies,
    SpreadParams,
} from '../../types/handler';
import { PayloadType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { basename } from 'path';
import { isDiscordEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';
import type { EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';

/**
 * Utility function to process command plugins for all Modules
 * @param payload
 */
export function processCommandPlugins<T extends DefinedCommandModule>(
    payload: { mod: T; absPath: string },
) {
    return payload.mod.plugins.map(plug => ({
        ...plug,
        name: plug?.name ?? 'Unnamed Plugin',
        description: plug?.description ?? '...',
        execute: plug.execute(payload, controller),
    }));
}

export function processEvents({ containerConfig, events }: Wrapper) {
    const [ sernEmitter, client ] = containerConfig.get('@sern/emitter', '@sern/client');
    const lazy = (k: string) => containerConfig.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable$(sernEmitter as SernEmitter, events!);
    const normalize$ = eventStream$.pipe(
        map(({ mod, absPath }) => {
            return <DefinedEventModule>{
                name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                ...mod,
            };
        }),
    );
    normalize$.subscribe(e => {
        const emitter = isSernEvent(e)
            ? sernEmitter
            : isDiscordEvent(e)
            ? client
            : lazy(e.emitter);
        if (emitter === undefined) {
            throw new Error(`Cannot find event emitter as it is undefined`);
        }
        //Would add sern event emitter for events loaded, attached onto sern emitter, but could lead to unwanted behavior!
        fromEvent(emitter as EventEmitter, e.name, e.execute as SpreadParams<typeof e.execute>).subscribe();
    });
}

function eventObservable$(emitter : SernEmitter, events: string) {
        return buildData<EventModule>(events).pipe(
                   errTap(reason =>
                      emitter.emit('module.register', {
                          type: PayloadType.Failure,
                          module: undefined,
                          reason,
                      }),
                  ),
              );
}
