import * as Files from '../core/module-loading'
import { UnpackedDependencies, Wrapper } from "../types/utility";
import type { ScheduledTask } from "../types/core-modules";
import { relative } from "path";
import { fileURLToPath } from "url";

export const registerTasks = async (tasksDirs: string | string[], deps: UnpackedDependencies) => {
    const taskManager = deps['@sern/scheduler']

    const directories = Array.isArray(tasksDirs) ? tasksDirs : [tasksDirs];

    for (const dir of directories) {
        for await (const path of Files.readRecursive(dir)) {
            let { module } = await Files.importModule<ScheduledTask>(path);
            //module.name is assigned by Files.importModule<>
            // the id created for the task is unique
            const uuid = module.name+"/"+relative(dir,fileURLToPath(path))
            taskManager.schedule(uuid, module, deps)
        }
    }
}
