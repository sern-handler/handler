import { concatMap, from, interval, of, map, scan, startWith } from "rxjs"
import { Files } from "../core/_internal";
import * as Presence from "../core/presences";
import { Services } from "../core/ioc";

type SetPresence = (conf: Presence.Result) => Promise<unknown>

const parseConfig = async (conf: Promise<Presence.Result>) => {
    return conf
        .then(s => {
            if('repeated' in s) {
                const { create, onInterval } = s.repeated;
                return interval(create).pipe(
                    scan(onInterval, s),
                    startWith(s));
            }
            //take 1?
            return of(s);
        })
};

export const presenceHandler = (path: string, setPresence: SetPresence) => {
    interface PresenceModule  {
        module: Presence.Config<(keyof Dependencies)[]>
    }
    const presence = Files
        .importModule<PresenceModule>(path)
        .then(({ module }) => {
            const fetchedServices = Services(...module.inject ?? []);
            return async () => module.execute(...fetchedServices);
        })
    const module$ = from(presence);
    return module$.pipe(
        concatMap(fn => parseConfig(fn())),
        concatMap(conf => conf.pipe(map(setPresence))))
}
