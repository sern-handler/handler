import { CronJob } from 'cron';
export class TaskScheduler {
    private __tasks: Map<string, CronJob> = new Map();

    scheduleTask(taskName: string, cronExpression: string, task: () => void): boolean {
        if (this.__tasks.has(taskName)) {
            return false;
        }
        try {
          const job = new CronJob(cronExpression, task);
          job.start();
          this.__tasks.set(taskName, job);
          return true;
        } catch (error) {
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
