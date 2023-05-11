import { Container } from "iti";
import { DefaultErrorHandling, DefaultModuleManager, SernEmitter } from "../";
import { isAsyncFunction} from "node:util/types";
import * as assert from 'node:assert'
import { Subject } from "rxjs";
import { ModuleStore } from "./module-store";

/**
 * Provides all the defaults for sern to function properly.
 * The only user provided dependency needs to be @sern/client
 */
export class CoreContainer<T extends Partial<Dependencies>> extends Container<T, {}> {
    private ready$ = new Subject<never>();
    constructor() {
        super();

        this.listenForInsertions();

        (this as Container<{}, {}>)
            .add({
                '@sern/errors': () => new DefaultErrorHandling(),
                '@sern/emitter': () => new SernEmitter(),
                '@sern/store': () => new ModuleStore(),
            }).add(ctx => {
                return { '@sern/modules': () => new DefaultModuleManager(ctx["@sern/store"]) };
            })
    }
    
    private listenForInsertions() {
       assert.ok(this.isReady(), "listening for init functions should only occur prior to sern being ready.")  

       const unsubscriber = this.on('containerUpserted', this.callInitHooks);
       this.ready$.subscribe({
           complete: unsubscriber
       });
    }

    private async callInitHooks(e: { key: keyof T, newContainer: T[keyof T]|null }) {

        const dep = e.newContainer;
        assert.ok(dep);

        //Ignore any dependencies that are not objects or array
        if(typeof(dep) !== 'object' || Array.isArray(dep)) {
            return;
        }
        if('init' in dep && typeof dep.init === 'function') {
            isAsyncFunction(dep.init) 
                ? await dep.init() 
                : dep.init()
        }    
    }

    isReady() {
        return this.ready$.closed;
    }
    ready() {
        this.ready$.unsubscribe();
    }
}
