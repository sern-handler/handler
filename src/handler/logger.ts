import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/timezone';

enum sEvent  {
    GLOBAL_SLASH,
    LOCAL_SLASH,
    TEXT_CMD,
    CRASH,
    DM,
    
}

export default class Logger {

    public log<T extends sEvent>(e : T, message: string) {
        dayjs.extend(utc)
        dayjs.extend(timezone)
        dayjs.tz.guess()
        const tz = dayjs().format();
        console.log(`[${`${tz}`}][${sEvent[e]}] :: ${message}`)
    }

    public tableRam() {  
        console.table(
            Object.entries(process.memoryUsage())
            .map(([k, v] : [string, number]) =>  { return {[k] : ((Math.round(v) / 1024 / 1024 * 100) / 100).toFixed(2) }})
            .reduce(((r, c) => Object.assign(r, c)), {})
        )
    }
}