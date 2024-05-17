import { beforeEach, describe, expect, vi, it } from 'vitest';
import { eventDispatcher } from '../../src/handlers/event-utils';
import { faker } from '@faker-js/faker';
import { TestScheduler } from 'rxjs/testing';
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

const testScheduler = new TestScheduler((actual, expected) => {
  // asserting the two objects are equal - required
  // for TestScheduler assertions to work via your test framework
  // e.g. using chai.
  expect(actual).deep.equal(expected);
});
 
describe('eventDispatcher standard', () => {
    let m: Processed<Module>;
    let ee: EventEmitter;
    beforeEach(() => {
        ee = new EventEmitter();
        m = createRandomModule();
    });

    it('should throw', () => {
        expect(() => eventDispatcher(m,  'not event emitter')).toThrowError();
    });

    it("Shouldn't throw", () => {
        expect(() => eventDispatcher(m, ee)).not.toThrowError();
    });
    //TODO
//    it('Should be called once', () => {
//            const s = eventDispatcher(m, ee);
//            console.log(m)
//            s.subscribe();
//            ee.emit(m.name);
//            console.log(m.execute)
//            expect(m.execute).toHaveBeenCalledOnce();
//    });
});
