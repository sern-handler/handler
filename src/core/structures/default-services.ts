import type { LogPayload, Logging, ErrorHandling } from '../interfaces';
import { CronJob } from 'cron';

/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using the defaults!
 */
export class DefaultErrorHandling implements ErrorHandling {
    crash(err: Error): never {
        throw err;
    }
    updateAlive(err: Error) {
        throw err;
    }
}


/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class DefaultLogging implements Logging {
    private date() { return new Date() } 
    debug(payload: LogPayload): void {
        console.debug(`DEBUG: ${this.date().toISOString()} -> ${payload.message}`);
    }

    error(payload: LogPayload): void {
        console.error(`ERROR: ${this.date().toISOString()} -> ${payload.message}`);
    }

    info(payload: LogPayload): void {
        console.info(`INFO: ${this.date().toISOString()} -> ${payload.message}`);
    }

    warning(payload: LogPayload): void {
        console.warn(`WARN: ${this.date().toISOString()} -> ${payload.message}`);
    }
}


export class TaskScheduler {
    private __tasks: Map<string, CronJob> = new Map();

    schedule(taskName: string, cronExpression: string | Date, task: () => void, tz: string|  undefined) {
        if (this.__tasks.has(taskName)) {
            throw Error("while scheduling a task \
                        found another task of same name. Not scheduling " +
                       taskName + "again."  );
        }
        try {
          const job = CronJob.from({ cronTime: cronExpression, onTick: task, timeZone: tz });
          job.start();
          this.__tasks.set(taskName, job);
        } catch (error) {
          throw Error(`while scheduling a task ${taskName} ` +  error);
        }
    }
  
    kill(taskName: string): boolean {
        const job = this.__tasks.get(taskName);
        if (job) {
            job.stop();
            this.__tasks.delete(taskName);
            return true;
        }
        return false;
    }
  
    private restartTask(taskName: string): boolean {
        const job = this.__tasks.get(taskName);
        if (job) {
            job.start();
            return true;
        }
        return false;
    }

    get tasks(): string[] {
        return Array.from(this.__tasks.keys());
    }
    
}
