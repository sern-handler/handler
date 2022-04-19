import type { Awaitable, Message } from 'discord.js';
import type { CommandType } from '../sern';
import { Observable, throwError } from 'rxjs';
import type { ModuleDefs } from '../structures/modules/commands/moduleHandler';
import { SernError } from '../structures/errors';
import { isNotFromBot } from '../utilities/messageHelpers';
import type { PluggedModule } from '../structures/modules/module';
import type { EventPlugin, SernPlugin } from '../plugins/plugin';


export function match<T extends keyof ModuleDefs>(
    plug: PluggedModule | undefined, type : T 
) : plug is { mod: ModuleDefs[T], plugins : SernPlugin[] } {
    return plug !== undefined && (plug.mod.type & type) != 0;
}

export function filterCorrectModule<T extends keyof ModuleDefs>(cmdType : T) {
    return (src : Observable<PluggedModule|undefined>) => 
        new Observable<{ mod : ModuleDefs[T], plugins : EventPlugin[] }>( subscriber => { 
            return src.subscribe({ 
                next(plug) {
                    if(match(plug, cmdType)) {
                       subscriber.next({ mod : plug.mod, plugins : <EventPlugin[]>plug.plugins });
                    } else {
                       if (plug === undefined) { 
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

export function filterTap<T extends keyof ModuleDefs>(
    cmdType : T,
    tap: (mod : ModuleDefs[T], plugins : EventPlugin[]) => Awaitable<void>
) {
    return (src : Observable<PluggedModule|undefined>) => 
        new Observable<PluggedModule|undefined>( subscriber => { 
            return src.subscribe({ 
                next(modul) {
                    if(match(modul, cmdType)) {
                       const asModT = <ModuleDefs[T]> modul!.mod; 
                       tap(asModT, modul!.plugins as EventPlugin[]);
                       subscriber.next(modul);
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





