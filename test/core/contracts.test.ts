import { assertType, beforeEach, describe, expect, it, vi } from 'vitest';
import { Listener, ModuleStore, listenerAdapter } from '../../src';
import * as DefaultContracts from '../../src/core/structures/services';
import * as Contracts from '../../src/core/contracts/index.js';
import { fromEvent, map, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

describe('default contracts', () => {
    it('should satisfy contracts', () => {
        assertType<Contracts.Logging>(new DefaultContracts.DefaultLogging());
        assertType<Contracts.ErrorHandling>(new DefaultContracts.DefaultErrorHandling());
        assertType<Contracts.ModuleManager>(
            new DefaultContracts.DefaultModuleManager(new ModuleStore()),
        );
        assertType<Contracts.CoreModuleStore>(new ModuleStore());
    });
});


// Mock emitter object for testing
describe('listenerAdapter', () => {
    let testListener: Listener & { source : any };
    let mockEmitter;
    let testScheduler = new TestScheduler((expected, actual) => {
        expect(actual).deep.equal(expected);
    })
    beforeEach(() => {
        vi.clearAllMocks();
        mockEmitter = {
            addListener: vi.fn().mockReturnValue("unsubscribe"),
            removeListener: vi.fn(),
        }
        testListener = listenerAdapter({
            source: mockEmitter,
            addListener: mockEmitter.addListener,
            removeListener: mockEmitter.removeListener
        })
    });

    it('should add and remove listeners correctly', () => {
        
        const eventName = 'testEvent';
        const listener = vi.fn();

        testListener.addListener(eventName, listener);
        expect(mockEmitter.addListener).toHaveBeenCalledWith({
            source: mockEmitter,
            name: eventName,
            handler: listener,
        });

        testListener.removeListener(eventName, listener);
        expect(mockEmitter.removeListener).toHaveBeenCalledWith({
            source: mockEmitter,
            name: eventName,
            handler: listener,
            unsubscribe: "unsubscribe",
        });

        expect(testListener.source).toBe(mockEmitter) 
    });
    
    it('adapts into fromEvent', () => {
        const listener = listenerAdapter({
            source: mockEmitter,
            addListener: mockEmitter.addListener,
            removeListener: mockEmitter.removeListener,
        });

        testScheduler.run(() => {
            const testevent$ = fromEvent(listener, 'test').subscribe();
            testevent$.unsubscribe()
            expect(mockEmitter.removeListener).toHaveBeenCalledOnce()
        })

    })

});

