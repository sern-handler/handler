import type { Awaitable, Message } from 'discord.js';
import { Observable, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import type { InteractionDefs, Module, ModuleDefs } from '../structures/module';
import { correctModuleType } from '../utilities/predicates';
import type { CommandType } from '../structures/enums';
import type { UnionToIntersection } from '../../types/handler';
import { controller } from '../sern';
import type { Result } from 'ts-results';
import type { SelectMenuInteraction } from 'discord.js';

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

// export function processOnEvents<T extends CommandType>(ty: T, interaction: InteractionDefs[T]) {
//     return (src: Observable<ModuleDefs[T]>) =>
//         new Observable<Awaitable<Result<void, void>>>(subscriber => {
//             return src.subscribe({
//                 next(m) {
//                     subscriber.next(m.onEvent?.map(e => {
//                         return (<UnionToIntersection<typeof e>>e).execute(
//                             [interaction as SelectMenuInteraction], //This is just to satisfy compiler
//                             controller,
//                         );
//                     })) ;
//                 },
//                 error: e => subscriber.error(e),
//                 complete: () => subscriber.complete(),
//             });
//         });
// }
