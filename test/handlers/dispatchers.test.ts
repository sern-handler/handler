import { beforeEach, describe, expect, vi, it } from 'vitest';
import { eventDispatcher } from '../../src/handlers/event-utils';
import { faker } from '@faker-js/faker';
import { Module } from '../../src/types/core-modules';
import { Processed } from '../../src/types/core-modules';
import { EventEmitter } from 'events';
import { EventType } from '../../dist/core/structures/enums';

function createRandomModule(): Processed<Module> {
    return {
        type: EventType.Discord,
        meta: { id:"", absPath: "" },
        description: faker.string.alpha(),
        name: "abc",
        onEvent: [],
        plugins: [],
        execute: vi.fn(),
    };
}

function mockDeps() {
   return {
        '@sern/client': {}
   }
}


 
describe('eventDispatcher standard', () => {
    let m: Processed<Module>;
    let ee: EventEmitter;
    beforeEach(() => {
        ee = new EventEmitter();
        m = createRandomModule();
    });

    it('should throw', () => {
        expect(() => eventDispatcher(mockDeps(), m,  'not event emitter')).toThrowError();
    });

    it("Shouldn't throw", () => {
        expect(() => eventDispatcher(mockDeps(), m, ee)).not.toThrowError();
    });
});
