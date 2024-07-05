import { TaskScheduler } from "../core/schedule"
import * as Files from '../core/module-loading'
import { UnpackedDependencies } from "../types/utility";

interface ScheduledTaskModule {
    name?: string;
    description?: string;
    pattern: string;
    execute(deps: UnpackedDependencies, tasks: string[]): any
}

export const registerTasks = async (path: string, deps: UnpackedDependencies) => {
    const taskManager = new TaskScheduler()

    for await (const f of Files.readRecursive(path)) {
        let { module } = await Files.importModule<ScheduledTaskModule>(f);
        //module.name is assigned by Files.importModule<>
        taskManager.scheduleTask(module.name!, module.pattern, () => {
            module.execute(deps, taskManager.tasks())
        })
    }

}
