import { concatMap, from, interval, of, map, scan, startWith, fromEvent } from "rxjs"
import { Files } from "../core/_internal";
import * as Presence from "../core/presences";
import { Services } from "../core/ioc";
import assert from "node:assert";

type SetPresence = (conf: Presence.Result) => Promise<unknown>

const parseConfig = async (conf: Promise<Presence.Result>) => {
    return conf
        .then(s => {
            if('repeat' in s) {
                const { onRepeat, repeat } = s;
                assert(repeat !== undefined, "repeat is undefined");
                assert(onRepeat !== undefined, "onRepeat callback is undefined, but repeat exists");
                const src$ = typeof repeat === 'number' 
                    ? interval(repeat)
                    : fromEvent(...repeat);
                    return src$
                        .pipe(scan(onRepeat, s), 
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
