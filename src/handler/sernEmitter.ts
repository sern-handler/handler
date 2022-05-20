import { EventEmitter } from 'events';
import type { Module } from './structures/module';
import type { Nullish } from '../types/handler';

type SernEventsMapping = {
    ['sern.command.registered'] : [ Module ];
    ['sern.command.success'] : [ Module ];
    ['sern.command.fail'] : [ Nullish<Module> ];
    ['sern.error'] : [ Error ];
}

export default class SernEmitter extends EventEmitter {

    public override on<T extends keyof SernEventsMapping>(eventName: T, listener: (...args: SernEventsMapping[T][]) => void): this {
       return super.on(eventName,listener);
    }
    public override once<T extends keyof SernEventsMapping>(eventName: T, listener: (...args: SernEventsMapping[T][]) => void): this {
       return super.once(eventName,listener);
    }
    public override emit<T extends keyof SernEventsMapping>(eventName: T, args : SernEventsMapping[T]): boolean {
       return super.emit(eventName, ...args);
    }
}


