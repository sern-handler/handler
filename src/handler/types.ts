import { ErrorHandling, Logging, ModuleManager, SernEmitter } from "../core";
import EventEmitter from "node:events";
import { Module } from "../core/types/modules";

export type Processed<T> = T & { name: string; description: string };

export type DependencyList = [
    SernEmitter,
    ErrorHandling,
    Logging | undefined,
    ModuleManager,
    EventEmitter,
];

export interface InitArgs<T extends Processed<Module>> {
    module: T;
    absPath: string;
}

export interface ImportPayload<T> {
    module: T;
    absPath: string;
}
