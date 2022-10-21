import type { Container } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import * as assert from 'assert';
import type { Dependencies, MapDeps } from '../../types/handler';
import SernEmitter from '../sernEmitter';
import { constFn } from '../utilities/functions';
import { DefaultModuleManager } from '../contracts';
import { ModuleStore } from '../structures/moduleStore';

export const containerSubject = new BehaviorSubject<Container<Dependencies & Record<string,unknown>, {}> | null>(null);
export function composeRoot<T extends Record<string,unknown>>(root: Container<T, T>) {
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
        root.upsert(({ '@sern/store': store }) => ({
            '@sern/modules' : constFn(new DefaultModuleManager(store as ModuleStore))
        }));
    }
}


export function useContainer<T extends Dependencies>() {
    const container = containerSubject.getValue() as Container<T & Record<string,unknown>, {}>;
    assert.ok(container !== null, 'useContainer was called before Sern#init');
    return <V extends (keyof T)[]>(keys: [...V]) => keys.map(key => container.get(key) as MapDeps<T, V>);
}
