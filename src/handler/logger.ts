import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
export class DefaultLogger implements Logger<DefaultEvent>  {

    clear () {
        console.clear()
    }

    log(message: string, e: DefaultEvent) {
      dayjs.extend(utc)
      dayjs.extend(timezone)
      dayjs.tz.guess()
      const tz = dayjs().format()
      console.log(`[${tz}][${DefaultEvent[e]}] ${message}`)  
    }
    
}

/**
 * @enum {string}
 */
export enum DefaultEvent {
    WARNING,
    ERROR,
    MESSAGE,
    INTERACTION,
    DATABASE,
    INFO
}

export interface Logger<T> {
    
    clear () : void;
    log(message : string, e: T) : void;

}

