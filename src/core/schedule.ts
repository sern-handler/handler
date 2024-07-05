import { CronJob } from 'cron';
export class TaskScheduler {
    private __tasks: Map<string, CronJob> = new Map();

    scheduleTask(taskName: string, cronExpression: string | Date, task: () => void, tz: string|  undefined): boolean {
        if (this.__tasks.has(taskName)) {
            console.warn("While scheduling a task",
                         "found another task of same name. Not scheduling",
                         taskName, "again");
            return false;
        }
        try {
          const job = CronJob.from({
              cronTime: cronExpression,
              onTick: task,
              timeZone: tz
          });
          job.start();
          this.__tasks.set(taskName, job);
          return true;
        } catch (error) {
          console.error("While scheduling a task " + error);
          return false;
        }
    }
  
    private stopTask(taskName: string): boolean {
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


    tasks(): string[] {
        return Array.from(this.__tasks.keys());
    }
    
}
