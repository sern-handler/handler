import { Container } from "iti";
import { DefaultErrorHandling, DefaultModuleManager, SernEmitter } from "../";
import { isAsyncFunction} from "node:util/types";
import * as assert from 'node:assert'
import { Dependencies } from "../ioc/types";
/**
 * Provides all the defaults for sern to function properly.
 * The only user provided dependency needs to be @sern/client
 */
export class CoreContainer<T extends Partial<Dependencies>> extends Container<T, {}> {
    private _ready = false;
    constructor() {
        super();
        (this as Container<{}, {}>)
            .add({
                '@sern/errors': () => new DefaultErrorHandling(),
                '@sern/emitter': () => new SernEmitter(),
                '@sern/modules': () => new DefaultModuleManager(new Map())
            })
    }

    async withInit<const Keys extends keyof Dependencies>(...keys: Keys[]) {
        if(this.isReady()) {
            throw Error("You cannot call this method after sern has started");
        }
        for await (const k of keys) {
           const dep = this.get(k);
           assert.ok(dep !== undefined);
           if('init' in dep && typeof dep.init === 'function') {
              isAsyncFunction(dep.init) 
                ? await dep.init() 
                : dep.init()
           } else {
             throw Error(`called withInit with key ${k} but found nothing to init`) 
           }
        }
        return this;
    }
    isReady() {
        return this._ready;
    }
    ready() {
        this._ready = true;
    }
}
