import dayJS from 'dayjs';
import Timezone from 'dayjs/plugin/timezone';
import UTC from 'dayjs/plugin/timezone';

enum sEvent  {
  GLOBAL_SLASH,
  LOCAL_SLASH,
  DM,
  CRASH,
  TEXT_CMD,
}

export default class Logger {
  public log<T extends sEvent>(e : T, message: string) {
    dayJS.extend(UTC);
    dayJS.extend(Timezone);
    dayJS.tz.guess();

    const tz = dayJS().format();
    console.log(`[${`${tz}`}][${sEvent[e]}] :: ${message}`);
  }

  /**
   * ┌──────────────┬─────────┐
   * │   (index)    │ Values  │
   * ├──────────────┼─────────┤
   * │     rss      │ '50.26' │
   * │  heapTotal   │ '29.15' │
   * │   heapUsed   │ '12.62' │
   * │   external   │ '0.84'  │
   * │ arrayBuffers │ '0.10'  │
   * └──────────────┴─────────┘         
   * This method will print out memory usage. Optional at startup.        
  */
  
    public tableRam() {
      console.table(
        Object.entries(process.memoryUsage())
          .map(([k, v]: [string, number]) => {
            return { [k]: ((Math.round(v) / 1024 / 1024 * 100) / 100).toFixed(2) };
          })
          .reduce(((r, c) => Object.assign(r, c)), {})
      );
    }
}
