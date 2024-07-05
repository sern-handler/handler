import { TaskScheduler } from "../core/schedule"
import * as Files from '../core/module-loading'
import { UnpackedDependencies } from "../types/utility";
import { ScheduledTask } from "../types/core-modules";
import { CronJob } from "cron";
import { relative } from "path";
import { fileURLToPath } from "url";

export const registerTasks = async (tasksPath: string, deps: UnpackedDependencies) => {
    const taskManager = new TaskScheduler()

    for await (const f of Files.readRecursive(tasksPath)) {
        let { module } = await Files.importModule<ScheduledTask & { meta: { absPath: string } }>(f);
        
        //module.name is assigned by Files.importModule<>
        // the id created for the task is unique
        const uuid = module.name!+"/"+relative(tasksPath,fileURLToPath(f))
       taskManager.scheduleTask(uuid, module.pattern, function(this: CronJob) {
            module.execute({  
                deps,
                runningTasks: taskManager.tasks(),
                lastTimeExecution: this.lastExecution,
                nextTimeExecution: this.nextDate().toJSDate()
            })
        }, module.timezone).unwrap()
    }
}
