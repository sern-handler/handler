import { Container } from 'iti';
import type { Disposable } from '../interfaces';
import * as assert from 'node:assert';
import { Subject } from 'rxjs';
import * as  __Services  from '../structures/default-services';
import * as Hooks from './hooks';
import { EventEmitter } from 'node:events';


/**
 * A semi-generic container that provides error handling, emitter, and module store. 
 * For the handler to operate correctly, The only user provided dependency needs to be @sern/client
 */
export class CoreContainer<T extends Partial<Dependencies>> extends Container<T, {}> {
    private ready$ = new Subject<void>();
    constructor() {
        super();
        assert.ok(!this.isReady(), 'Listening for dispose & init should occur prior to sern being ready.');

        const { unsubscribe } = Hooks.createInitListener(this);

        this.ready$
            .subscribe({ complete: unsubscribe });

        (this as Container<{}, {}>)
            .add({ '@sern/errors': () => new __Services.DefaultErrorHandling,
                   '@sern/emitter': () => new EventEmitter({ captureRejections: true }) })
    }

    isReady() {
        return this.ready$.closed;
    }
    
    hasKey(key: string): boolean {
        return Boolean((this as Container<any,any>)._context[key]);
    }

    override async disposeAll() {
        const otherDisposables = Object
            .entries(this._context)
            .flatMap(([key, value]) => 
                'dispose' in value ? [key] : []);
        otherDisposables.forEach(key => { 
            //possible source of bug: dispose is a property.
            this.addDisposer({ [key]: (dep: Disposable) => dep.dispose() } as never);
        })
        await super.disposeAll();
    }
    
    ready() {
        this.ready$.complete();
        this.ready$.unsubscribe();
    }
}
