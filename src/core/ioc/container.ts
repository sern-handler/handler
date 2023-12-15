import { Container } from 'iti';
import { Disposable, SernEmitter } from '../';
import * as assert from 'node:assert';
import { Subject } from 'rxjs';
import { DefaultServices, ModuleStore } from '../_internal';
import * as Hooks from './hooks'


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
            .add({ '@sern/errors': () => new DefaultServices.DefaultErrorHandling(),
                   '@sern/emitter': () => new SernEmitter(),
                   '@sern/store': () => new ModuleStore() })
            .add(ctx => {
                return {
                    '@sern/modules': () =>
                        new DefaultServices.DefaultModuleManager(ctx['@sern/store']),
                };
            });
    }

    isReady() {
        return this.ready$.closed;
    }
    override async disposeAll() {
        
        const otherDisposables = Object
            .entries(this._context)
            .flatMap(([key, value]) => 
                'dispose' in value ? [key] : []);

        for(const key of otherDisposables) {
            this.addDisposer({ [key]: (dep: Disposable) => dep.dispose() } as never);
        }
        await super.disposeAll() 
    }
    ready() {
        this.ready$.complete();
        this.ready$.unsubscribe();
    }
}
