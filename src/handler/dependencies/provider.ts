import type { Container } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import * as assert from 'assert';
import type { Dependencies, MapDeps } from '../../types/handler';
import SernEmitter from '../sernEmitter';
import { constFn } from '../utilities/functions';
import { DefaultErrorHandling, DefaultModuleManager } from '../contracts';
import { ModuleStore } from '../structures/moduleStore';
import { Result } from 'ts-results-es';

export const containerSubject = new BehaviorSubject<Container<Dependencies, {}> | null>(null);
export function composeRoot<T extends Dependencies>(root: Container<Partial<T>, {}>) {
    const client = root.get('@sern/client');
    assert.ok(client !== undefined, SernError.MissingRequired);
    const getOr = (key: keyof Dependencies, or: () => unknown) => Result.wrap(() => root.get(key)).unwrapOr(or());
    getOr('@sern/emitter', () =>
        root.upsert({
            '@sern/emitter' : constFn(new SernEmitter())
        })
    );
    getOr('@sern/logger', () =>
        root.upsert({
            '@sern/logger' : constFn(console)
        })
    );
    getOr('@sern/store', () =>
        root.upsert({
            '@sern/store' : constFn(new ModuleStore())
        })
    );
    getOr('@sern/modules', () =>
        root.upsert((ctx) => ({
            '@sern/modules' : constFn(new DefaultModuleManager(ctx['@sern/store'] as ModuleStore))
        }))
    );
    getOr('@sern/errors', () =>
        root.upsert({
            '@sern/errors': constFn(new DefaultErrorHandling())
        })
    );
}


export function useContainer<T extends Dependencies>() {
    const container = containerSubject.getValue()! as unknown as Container<T, {}>;
    assert.ok(container !== null, 'useContainer was called before Sern#init');
    return <V extends (keyof T)[]>(...keys: [...V]) => keys.map(key => container.get(key)) as MapDeps<T, V>;
}
