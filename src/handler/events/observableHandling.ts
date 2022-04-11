import type { Awaitable, Message } from 'discord.js';
import type { CommandType } from '../sern';
import type { Module } from '../structures/structxports';
import { Observable, throwError } from 'rxjs';
import type { ModuleDefs } from '../structures/modules/commands/moduleHandler';
import { SernError } from '../structures/errors';
import { isNotFromBot } from '../utilities/messageHelpers';

export function match(mod: Module | undefined, type : CommandType) : boolean {
    return mod !== undefined && (mod.type & type) != 0;
}
export function filterTap<T extends keyof ModuleDefs>(
    cmdType : T,
    tap: (mod : ModuleDefs[T]) => Awaitable<void>
) {
    return (src : Observable<Module|undefined>) => 
        new Observable<Module|undefined>( subscriber => { 
            return src.subscribe({ 
                next(modul) {
                    if(match(modul, cmdType)) {
                       const asModT = <ModuleDefs[T]> modul; 
                       tap(asModT);
                       subscriber.next(asModT);
                    } else {
                       if (modul === undefined) { 
                          return throwError(() => SernError.UndefinedModule); 
                       }
                       return throwError(() => SernError.MismatchModule);
                    }
                },
                error: (e) =>  subscriber.error(e),
                complete: () => subscriber.complete()
            });
        });
  }

export function ignoreNonBot(prefix : string) {
    return (src : Observable<Message>) => 
        new Observable<Message>(subscriber => {
           return src.subscribe({
               next(m) {
                  const passAll = [
                    isNotFromBot,
                    (m : Message) => 
                       m.content
                        .slice(0,prefix.length)
                        .localeCompare(prefix,
                         undefined, { sensitivity : 'accent' }
                        ) === 0
                  ].every( fn => fn(m));

                  if (passAll) {
                    subscriber.next(m);
                  }
               },
               error: (e) =>  subscriber.error(e),
               complete: () => subscriber.complete()
            });
       });
}
export function partition<T,U extends T,V extends T>
    (array: T[], isValid: (el : T) => el is U): [U[], V[]] {
        return array.reduce(([pass, fail], elem) => {
            return isValid(elem) 
            ? [[...pass, <U>elem], fail]
            : [pass, [...fail, <V>elem]];
    }, [<U[]>[], <V[]>[]] );
}


