import type { Message } from 'discord.js';
import { Observable, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import type { Module, ModuleDefs } from '../structures/module';
import { correctModuleType } from '../utilities/predicates';
export function filterCorrectModule<T extends keyof ModuleDefs>(cmdType: T) {
    return (src: Observable<Module | undefined>) =>
        new Observable<ModuleDefs[T]>(subscriber => {
            return src.subscribe({
                next(mod) {
                    if (mod === undefined) {
                        return throwError(() => SernError.UndefinedModule);
                    }
                    if (correctModuleType(mod, cmdType)) {
                        subscriber.next(mod!);
                    } else {
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
        new Observable<Message>(subscriber => {
            return src.subscribe({
                next(m) {
                    const messageFromHumanAndHasPrefix =
                        !m.author.bot &&
                        m.content
                            .slice(0, prefix.length)
                            .localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0;
                    if (messageFromHumanAndHasPrefix) {
                        subscriber.next(m);
                    }
                },
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
}