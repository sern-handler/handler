import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreContainer } from '../../src/core/ioc/container';
import { EventEmitter } from 'events';
import { Disposable, Emitter, Init, Logging } from '../../src/core/interfaces';
import { __Services } from '../../src/core/structures'
import { CoreDependencies } from '../../src/types/ioc';

describe('ioc container', () => {
    let container: CoreContainer<{}> = new CoreContainer();
    let dependency: Logging & Init & Disposable;
    let dependency2: Emitter
    beforeEach(() => {
        dependency = {
            init: vi.fn(),
            error(): void {},
            warning(): void {},
            info(): void {},
            debug(): void {},
            dispose: vi.fn()
        };
        dependency2 = {
            addListener: vi.fn(),
            removeListener: vi.fn(),
            emit: vi.fn()
        };
        container = new CoreContainer();
    });
    const wait = (seconds: number) =>  new Promise((resolve) => setTimeout(resolve, seconds));
    class DB implements Init, Disposable {
      public connected = false
      constructor() {}
      async init() {
        this.connected = true
        await wait(10)
      }
      async dispose() {
        await wait(20)
        this.connected = false
      }
    }
    it('should be ready after calling container.ready()', () => {
        container.ready();
        expect(container.isReady()).toBe(true);
    });
    it('should container all core dependencies', async () => {
        const keys = [
            '@sern/emitter',
            '@sern/logger',
            '@sern/errors',
        ] satisfies (keyof CoreDependencies)[];
        container.add({
            '@sern/logger': () => new __Services.DefaultLogging(),
            '@sern/client': () => new EventEmitter(),
        });
        for (const k of keys) {
            //@ts-expect-error typings for iti are strict
            expect(() => container.get(k)).not.toThrow();
        }
    });
    it('should init modules', () => {
        container.upsert({ '@sern/logger': dependency });
        container.ready();
        expect(dependency.init).to.toHaveBeenCalledOnce();
    });
    it('should dispose modules', async () => {
        
        container.upsert({ '@sern/logger': dependency })

        container.ready();
        // We need to access the dependency at least once to be able to dispose of it.
        container.get('@sern/logger' as never);
        await container.disposeAll();
        expect(dependency.dispose).toHaveBeenCalledOnce();
    });

    it('should init and dispose', async () => {
        container.add({ db: new DB() })
        container.ready()
        const db = container.get('db' as never) as DB
        expect(db.connected).toBeTruthy()

        await container.disposeAll();

        expect(db.connected).toBeFalsy()
    })

    it('should not lazy module', () => {
        container.upsert({ '@sern/logger': () => dependency });
        container.ready();
        expect(dependency.init).toHaveBeenCalledTimes(0);
    });

    it('should init dependency depending on something else', () => {
        container.add({ '@sern/client': dependency2 });
        container.upsert((cntr) => ({ '@sern/logger': dependency }));
        container.ready();
        expect(dependency.init).toHaveBeenCalledTimes(1);
    })

    it('should detect a key already exists', () => {
        container.add({ '@sern/client': dependency2 });
        expect(container.hasKey('@sern/client')).toBeTruthy()
    })


    it('should detect a key already exists', () => {
        container.add({ '@sern/client': () => dependency2 });
        expect(container.hasKey('@sern/client')).toBeTruthy()
    })

});
