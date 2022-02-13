import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/timezone';

enum sEvent  {
  TEXT_CMD,
  GLOBAL_SLASH,
  LOCAL_SLASH,
  DM,  
  CRASH,
}

class Logger {
  public log<T extends sEvent>(e : T, message: string) {
    console.log(`[${'ISOSTRING (todo) '}][${sEvent[e]}] :: ${message}`);
  }
}
