import type { LogPayload, Logging, ErrorHandling, Emitter } from '../interfaces';
import { AnyFunction, UnpackedDependencies } from '../../types/utility';

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

export class CronScheduler {
    tasks: string[] = [];
    constructor(private deps: UnpackedDependencies) {}
//    addListener(eventName: string | symbol, listener: AnyFunction): this {
//        const retrievedModule = this.modules.get(eventName);
//        if(!retrievedModule) throw Error("Adding task: module " +eventName +"was not found");
//        const { pattern, name, runOnInit, timezone } = retrievedModule;
//        cron.schedule(pattern, 
//            (date) => listener({ date, deps: this.deps }),
//            { name, runOnInit, timezone, scheduled: true });
//        return this;
//    }
//    removeListener(eventName: string | symbol, listener: AnyFunction) {
//        const retrievedModule = this.modules.get(eventName);
//        if(!retrievedModule) throw Error("Removing cron: module " +eventName +"was not found");
//        const task = cron.getTasks().get(retrievedModule.name!) 
//        if(!task) throw Error("Finding cron task with"+ retrievedModule.name + " not found");
//        task.stop();
//        return this;
//    }
//    emit(eventName: string | symbol, ...payload: any[]): boolean {
//        const retrievedModule = this.modules.get(eventName);
//        if(!retrievedModule) throw Error("Removing cron: module " +eventName +"was not found");
//        const task= cron.getTasks().get(retrievedModule.name!) 
//        return task?.emit(eventName, payload) ?? false;
//    }
}
