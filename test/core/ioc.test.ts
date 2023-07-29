import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreContainer } from '../../src/core/ioc/container';
import { CoreDependencies } from '../../src/core/ioc';
import { EventEmitter } from 'events';
import { DefaultLogging, Init, Logging } from '../../src/core';

describe('ioc container', () => {
    let container: CoreContainer<{}>;
    let initDependency: Logging & Init;
    beforeEach(() => {
        initDependency = {
            init: vi.fn(),
            error(): void {},
            warning(): void {},
            info(): void {},
            debug(): void {},
        };
        container = new CoreContainer();
    });

    it('should be ready after calling container.ready()', () => {
        container.ready();
        expect(container.isReady()).toBe(true);
    });
    it('should container all core dependencies', async () => {
        const keys = [
            '@sern/modules',
            '@sern/emitter',
            '@sern/logger',
            '@sern/errors',
        ] satisfies (keyof CoreDependencies)[];
        container.add({
            '@sern/logger': () => new DefaultLogging(),
            '@sern/client': () => new EventEmitter(),
        });
        for (const k of keys) {
            //@ts-expect-error typings for iti are strict
            expect(() => container.get(k)).not.toThrow();
        }
    });
    it('should init modules', () => {
        container.upsert({ '@sern/logger': initDependency });
        container.ready();
        expect(initDependency.init).to.toHaveBeenCalledOnce();
    });

    it('should not lazy module', () => {
        container.upsert({ '@sern/logger': () => initDependency });
        container.ready();
        expect(initDependency.init).toHaveBeenCalledTimes(0);
    });
});
