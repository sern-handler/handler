import type { Awaitable, Message } from 'discord.js';

import type { CommandType } from '../sern';
import type { Module } from '../structures/structxports';
import type { ModuleDefs } from '../structures/modules/commands/moduleHandler';

import { Observable, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import { isFromBot, isFromDM } from '../utilities/messageHelpers';

export function match(mod: Module | undefined, type: CommandType): boolean {
    return mod !== undefined && (mod.type & type) != 0;
}
export function filterTap<T extends keyof ModuleDefs>(
    cmdType: T,
    tap: (mod: ModuleDefs[T]) => Awaitable<void>
) {
    return (src: Observable<Module | undefined>) =>
        new Observable<Module | undefined>(subscriber => {
            return src.subscribe({
                next(modul) {
                    if (match(modul, cmdType)) {
                        const asModT = <ModuleDefs[T]>modul;
                        tap(asModT);
                        subscriber.next(asModT);
                    } else {
                        if (modul === undefined) {
                            return throwError(() => SernError.UNDEFINED_MODULE);
                        }
                        return throwError(() => SernError.MISMATCH_MODULE_TYPE);
                    }
                },
                error: (e) => subscriber.error(e),
                complete: () => subscriber.complete()
            });
        });
}

export function ignoreNonBot(prefix: string) {
    return (src: Observable<Message>) =>
        new Observable<Message>(subscriber => {
            return src.subscribe({
                next(m) {
                    const passAll = [
                        !isFromDM,
                        !isFromBot,
                        (m: Message) =>
                            m.content
                                .slice(0, prefix.length)
                                .localeCompare(prefix,
                                    undefined, { sensitivity: 'accent' }
                                ) === 0
                    ].every(fn => fn(m));

                    if (passAll) {
                        subscriber.next(m);
                    }
                },
                error: (e) => subscriber.error(e),
                complete: () => subscriber.complete()
            });
        });
}


