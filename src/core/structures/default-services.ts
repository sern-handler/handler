import { ScheduledTask } from '../../types/core-modules';
import type { LogPayload, Logging, ErrorHandling, Disposable } from '../interfaces';
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


export class TaskScheduler implements Disposable {
    private __tasks: Map<string, CronJob<any, any>> = new Map();

    schedule(uuid: string, task: ScheduledTask, deps: Dependencies) {
        if (this.__tasks.has(uuid)) {
            throw Error("while scheduling a task \
                         found another task of same name. Not scheduling " +
                         uuid + "again."  );
        }
        try {
            const onTick = async function(this: CronJob) {
                task.execute({
                    deps, id: uuid,
                    lastTimeExecution: this.lastExecution,
                    nextTimeExecution: this.nextDate().toJSDate()
                })
           }
           const job = CronJob.from({ cronTime: task.trigger, onTick, timeZone: task.timezone });
           job.start();
           this.__tasks.set(uuid, job);
        } catch (error) {
           throw Error(`while scheduling a task ${uuid} ` +  error);
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
  
    get tasks(): string[] {
        return Array.from(this.__tasks.keys());
    }

    dispose() {
        for(const [id,] of this.__tasks){
            this.kill(id);
            this.__tasks.delete(id);
        }
    }
    
}
