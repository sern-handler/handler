import type { Container } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import * as assert from 'assert';
import type { Dependencies, MapDeps } from '../../types/handler';
import SernEmitter from '../sernEmitter';
import { constFn } from '../utilities/functions';
import { DefaultErrorHandling, DefaultModuleManager } from '../contracts';
import { ModuleStore } from '../structures/moduleStore';

export const containerSubject = new BehaviorSubject<Container<Dependencies, {}> | null>(null);
export function composeRoot<T extends Dependencies>(root: Container<Partial<T>, {}>) {
    const client = root.get('@sern/client');
    assert.ok(client !== undefined, SernError.MissingRequired);
    if(root.get('@sern/emitter') === undefined) {
        root.upsert({
            '@sern/emitter' : constFn(new SernEmitter())
        });
    }
    if(root.get('@sern/logger') === undefined) {
        root.upsert({
            '@sern/logger' : constFn(console)
        });
    }
    if(root.get('@sern/store') === undefined) {
        root.upsert({
            '@sern/store' : constFn(new ModuleStore())
        });
    }
    if(root.get('@sern/modules') === undefined) {
        root.upsert((ctx) => ({
            '@sern/modules' : constFn(new DefaultModuleManager(ctx['@sern/store'] as ModuleStore))
        }));
    }
    if(root.get('@sern/errors') === undefined) {
        root.upsert({
            '@sern/errors': constFn(new DefaultErrorHandling())
        });
    }
}


export function useContainer<T extends Dependencies>() {
    const container = containerSubject.getValue()! as unknown as Container<T, {}>;
    assert.ok(container !== null, 'useContainer was called before Sern#init');
    return <V extends (keyof T)[]>(...keys: [...V]) => keys.map(key => container.get(key)) as MapDeps<T, V>;
}
