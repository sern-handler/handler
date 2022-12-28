import type { Container } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import * as assert from 'assert';
import type { Dependencies, MapDeps } from '../../types/handler';
import SernEmitter from '../sernEmitter';
import { _const, ok } from '../utilities/functions';
import { DefaultErrorHandling, DefaultModuleManager, Logging } from '../contracts';
import { ModuleStore } from '../structures/moduleStore';
import { Ok, Result } from 'ts-results-es';
import { DefaultLogging } from '../contracts';

export const containerSubject = new BehaviorSubject<Container<Dependencies, Partial<Dependencies>> | null>(null);
export function composeRoot<T extends Dependencies>(root: Container<Partial<T>, Partial<Dependencies>>, exclusion: Set<keyof Dependencies>) {
    const client = root.get('@sern/client');
    assert.ok(client !== undefined, SernError.MissingRequired);
    //A utility function checking if a dependency has been declared excluded
    const excluded = (key: keyof Dependencies) => exclusion.has(key);
    //Wraps a fetch to the container in a Result, deferring the action
    const get = <T>(key : keyof Dependencies) => Result.wrap(() => root.get(key) as T);
    const getOr = (key: keyof Dependencies, elseAction: () => unknown) => {
        //Gets dependency but if an Err, map to a function that upserts.
        const dep = get(key).mapErr(() => elseAction);
        if(dep.err) {
            //Defers upsert until final check here
            return dep.val();
        }
    };
    const xGetOr = (key: keyof Dependencies, action: () => unknown) => {
        if(excluded(key)) {
            get(key) //if dev created a dependency but excluded, deletes on root composition
                .andThen(() => Ok(root.delete(key)))
                .unwrapOr(ok());
        } else {
            getOr(key, action);
        }

    };
    xGetOr('@sern/emitter', () => root.upsert({
            '@sern/emitter' : _const(new SernEmitter())
        })
    );
    //An "optional" dependency
    xGetOr('@sern/logger', () => {
        root.upsert({
                '@sern/logger' : _const(new DefaultLogging())
            });
        }
    );
    xGetOr('@sern/store', () => root.upsert({
            '@sern/store' : _const(new ModuleStore())
        })
    );
    xGetOr('@sern/modules', () => root.upsert((ctx) => ({
            '@sern/modules' : _const(new DefaultModuleManager(ctx['@sern/store'] as ModuleStore))
        }))
    );
    xGetOr('@sern/errors', () => root.upsert({
            '@sern/errors': _const(new DefaultErrorHandling())
        })
    );
    //If logger exists, log info, else do nothing.
    get<Logging>('@sern/logger')
        .map((logger => logger.info({ message: 'All dependencies loaded successfully' })))
        .unwrapOr(ok());
}


export function useContainer<T extends Dependencies>() {
    const container = containerSubject.getValue()! as unknown as Container<T, {}>;
    assert.ok(container !== null, 'useContainer was called before Sern#init');
    //weird edge case, why can i not use _const here?
    return <V extends (keyof T)[]>(...keys: [...V]) =>
        keys.map(key => Result.wrap(() => container.get(key)).unwrapOr(undefined)) as MapDeps<T, V>;
}

/**
 * Returns the underlying data structure holding all dependencies.
 * Exposes some methods from iti
 */
export function useContainerRaw() {
    return containerSubject.getValue();
}