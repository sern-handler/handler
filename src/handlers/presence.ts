import { interval, scan, startWith, fromEvent, take, of } from "rxjs"
import { PresenceConfig, PresenceResult } from "../core/presences";
import assert from "node:assert";

type SetPresence = (conf: PresenceResult) => Promise<unknown>

const parseConfig = async (conf: Promise<PresenceResult>) => {
    return conf.then(s => {
        if('repeat' in s) {
            const { onRepeat, repeat } = s;
            assert(repeat !== undefined, "repeat option is undefined");
            assert(onRepeat !== undefined, "onRepeat callback is undefined, but repeat exists");
            const src$ = typeof repeat === 'number' 
                ? interval(repeat)
                : fromEvent(...repeat);
                return src$
                    .pipe(scan(onRepeat, s), 
                          startWith(s));
        }
        return of(s).pipe(take(1));
    })
};

//    const presence = Files
//        .importModule<PresenceModule>(path)
//        .then(({ module }) => {
//            //fetch services with the order preserved, passing it to the execute fn 
//            const fetchedServices = Services(...module.inject ?? []);
//            return async () => module.execute(...fetchedServices);
//        })
//    const module$ = from(presence);
//    return module$.pipe(
//        //compose:
//        //call the execute function, passing that result into parseConfig.
//        //concatMap resolves the promise, and passes it to the next concatMap.
//        concatMap(fn => parseConfig(fn())),
//        // subscribe to the observable parseConfig yields, and set the presence.
//        concatMap(conf => conf.pipe(map(setPresence))));

