import type { Container } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import * as assert from 'assert';
import type { MapDeps, RequiredDependencies } from '../../types/handler';
import SernEmitter from '../sernEmitter';
import { constFn } from '../utilities/functions';

export const containerSubject = new BehaviorSubject<Container<RequiredDependencies & Record<string,unknown>, {}> | null>(null);

export function requireDependencies<T extends Record<string,unknown>>(root: Container<T, T>) {
    const client = root.get('@sern/client');
    assert.ok(client !== undefined, SernError.MissingRequired);
    if(root.get('@sern/emitter') === undefined) {
        root.upsert({
            '@sern/emitter' : constFn(new SernEmitter())
        });
    }
}


export function useContainer<T extends RequiredDependencies>() {
    const container = containerSubject.getValue() as Container<T & Record<string, unknown>, {}>;
    assert.ok(container !== null, 'useContainer was called before Sern#init');
    return <V extends (keyof T)[]>(keys: [...V]) => keys.map(key => container.get(key) as MapDeps<T, V>);
}
