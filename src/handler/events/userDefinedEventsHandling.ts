import { fromEvent, map } from 'rxjs';
import { buildData } from '../utilities/readFile';
import { controller } from '../sern';
import type {
    DefinedCommandModule,
    DefinedEventModule, Dependencies,
    SpreadParams,
} from '../../types/handler';
import { PayloadType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { isDiscordEvent, isExternalEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';
import type { EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';
import { nameOrFilename } from '../utilities/functions';
import { match } from 'ts-pattern';
import { discordEventDispatcher, externalEventDispatcher, sernEmitterDispatcher } from './dispatchers';
import type { ErrorHandling } from '../contracts';
import { SernError } from '../structures/errors';

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
    const [ client, error, sernEmitter ] = containerConfig.get('@sern/emitter', '@sern/client') as [EventEmitter, ErrorHandling, SernEmitter?];
    const lazy = (k: string) => containerConfig.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable$(events!, sernEmitter);
    const normalize$ = eventStream$.pipe(
        map(({ mod, absPath }) => {
            return <DefinedEventModule>{
                name: nameOrFilename(mod.name, absPath),
                ...mod,
            };
        }),
    );
    normalize$.subscribe(e => {
        const s = match(e)
            .when(isSernEvent, sernEmitterDispatcher(sernEmitter))
            .when(isDiscordEvent, discordEventDispatcher(client))
            .when(isExternalEvent, e => externalEventDispatcher(lazy(e.emitter)))
            .otherwise(() => error.crash(Error(SernError.InvalidModuleType)));
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

function eventObservable$(events: string, emitter?: SernEmitter) {
        return buildData<EventModule>(events).pipe(
                   errTap(reason =>
                      emitter?.emit('module.register', {
                          type: PayloadType.Failure,
                          module: undefined,
                          reason,
                      }),
                  ),
              );
}
