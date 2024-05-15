import type { LogPayload, Logging, ErrorHandling } from '../interfaces';
import { AnyFunction } from '../../types/utility';
import cron from 'node-cron'
import { EventEmitter } from 'events';
import type { CronEventCommand, Module } from '../../types/core-modules'
import { EventType } from './enums';
/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using the defaults!
 */
export class DefaultErrorHandling implements ErrorHandling {
    crash(err: Error): never {
        throw err;
    }
    keepAlive = 1;
    updateAlive(err: Error) {
        this.keepAlive--;
        if (this.keepAlive === 0) {
            throw err;
        }
    }
}


/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class DefaultLogging implements Logging {
    private date = () => new Date();
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

export class Cron extends EventEmitter { 
    tasks: string[] = [];
    modules: Map<string, CronEventCommand> = new Map();
    private sanityCheck(eventName: string | symbol) : asserts eventName is string {
        if(typeof eventName === 'symbol') throw Error("Cron cannot add symbol based listener")
        if(!cron.validate(eventName)) {
            throw Error("Invalid cron expression while adding")
        }
    }
    addCronModule(module: Module) {
        if(module.type !== EventType.Cron) {
            throw Error("Can only add cron modules");
        }
        this.modules.set(module.name!, module as CronEventCommand); 
    }
    addListener(eventName: string | symbol, listener: AnyFunction): this {
        this.sanityCheck(eventName);
        const retrievedModule = this.modules.get(eventName);
        if(!retrievedModule) throw Error("Adding task: module " +eventName +"was not found");
        cron.schedule(retrievedModule.pattern, listener, {
            name: retrievedModule?.name!
        });
        return this;
    }
    removeListener(eventName: string | symbol, listener: AnyFunction) {
        this.sanityCheck(eventName);
        const retrievedModule = this.modules.get(eventName);
        if(!retrievedModule) throw Error("Removing cron: module " +eventName +"was not found");
        const task= cron.getTasks().get(retrievedModule.name!) 
        if(!task) throw Error("Finding cron task with"+ retrievedModule.name + " not found");
        task.stop();
        super.removeListener(eventName, listener);
        return this;
    }
}
