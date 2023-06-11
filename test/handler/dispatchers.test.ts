import { beforeEach, describe, expect, vi, it } from 'vitest';
import { eventDispatcher, contextArgs, createDispatcher } from '../../src/handler/events/dispatchers';
import { faker } from '@faker-js/faker'
import { Module } from '../../src/core/types/modules';
import { Processed } from '../../src/handler/types';
import { CommandType } from '../../src/core';
import { EventEmitter } from 'events';

function createRandomModule(): Processed<Module> { 
    return {
        type: faker.number.int({ min: CommandType.Text, max: CommandType.ChannelSelect }),
        description: faker.string.alpha(),
        name: faker.string.alpha(),
        onEvent: [],
        plugins: [],
        execute : vi.fn()
    }

}

describe('eventDispatcher standard', () => {
    let m : Processed<Module>
    let ee: EventEmitter
    beforeEach( () => {
        ee = new EventEmitter()
        m = createRandomModule()
    })

    it('should throw', () => { 
        expect(() => eventDispatcher(m, 'not event emitter')).toThrowError()
    })
    it("Shouldn't throw", () => {
        expect(() => eventDispatcher(m, ee)).not.toThrowError()
    })
    
    it("Should be called once", () => {
        const s = eventDispatcher(m ,ee);
        s.subscribe()
        ee.emit(m.name, faker.string.alpha())
       
        expect(m.execute).toHaveBeenCalledOnce()
    })
});
