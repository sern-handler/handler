import { SpyInstance, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreContainer } from '../../src/core/ioc/container';
import { __Services } from '../../src/core/structures/';
import { faker } from '@faker-js/faker';
import { commandModule, CommandType } from '../../src';

function createRandomCommandModules() {
    return commandModule({
        type: CommandType.Slash,
        description: faker.string.alpha(),
        name: faker.string.alpha({ length: { min: 5, max: 10 }}),
        execute: vi.fn(),
    });
}
describe('services', () => {
    //@ts-ignore
    let container: CoreContainer<Dependencies>;
    let consoleMock: SpyInstance;
    beforeEach(() => {
        container = new CoreContainer();
        container.add({ '@sern/logger': () => new __Services.DefaultLogging() });
        container.ready();
        consoleMock = vi.spyOn(container.get('@sern/logger'), 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        consoleMock.mockReset();
    });

    //todo add more
    it('error-handling', () => {
        const errorHandler = container.get('@sern/errors');
        const lifetime = errorHandler.keepAlive;
        for (let i = 0; i < lifetime; i++) {
            if (i == lifetime - 1) {
                expect(() => errorHandler.updateAlive(new Error('poo'))).toThrowError();
            } else {
                expect(() => errorHandler.updateAlive(new Error('poo'))).not.toThrowError();
            }
        }
    });
    //todo add more, spy on every instance?
    it('logger', () => {
        container.get('@sern/logger').error({ message: 'error' });

        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith({ message: 'error' });
    });


    
});
