import type { Message } from 'discord.js';
import { Observable, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import { isNotFromBot } from '../utilities/messageHelpers';
import type { Module, ModuleDefs } from '../structures/module';

export function correctModuleType<T extends keyof ModuleDefs>(
    plug: Module | undefined,
    type: T,
): plug is ModuleDefs[T] {
    return plug !== undefined && plug.type === type;
}

export function filterCorrectModule<T extends keyof ModuleDefs>(cmdType: T) {
    return (src: Observable<Module | undefined>) =>
        new Observable<ModuleDefs[T]>(subscriber => {
            return src.subscribe({
                next(mod) {
                    if (correctModuleType(mod, cmdType)) {
                        subscriber.next(mod);
                    } else {
                        if (mod === undefined) {
                            return throwError(() => SernError.UndefinedModule);
                        }
                        return throwError(() => SernError.MismatchModule);
                    }
                },
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
}

export function ignoreNonBot(prefix: string) {
    return (src: Observable<Message>) =>
        new Observable(subscriber => {
            return src.subscribe({
                next(m) {
                    const passAll = [
                        isNotFromBot,
                        (m: Message) =>
                            m.content
                                .slice(0, prefix.length)
                                .localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0,
                    ].every(fn => fn(m));

                    if (passAll) {
                        subscriber.next(m);
                    }
                },
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
}

