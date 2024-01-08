import { describe, expect, it, vi } from 'vitest';
import * as Id from '../../src/core/id';
import { faker } from '@faker-js/faker';
import { CommandModule, CommandType, commandModule } from '../../src';

function createRandomCommandModules() {
    const randomCommandType = [
        CommandType.Text,
        CommandType.Both,
        CommandType.CtxMsg,
        CommandType.CtxUser,
        CommandType.Modal,
        CommandType.ChannelSelect,
        CommandType.RoleSelect,
        CommandType.UserSelect,
        CommandType.StringSelect,
        CommandType.Button,
    ];
    return commandModule({
        type: faker.helpers.uniqueArray(randomCommandType, 1)[0],
        description: faker.string.alpha(),
        name: faker.string.alpha(),
        execute: () => {},
    });
}
function createMetadata(c: CommandModule) {
    return {
        fullPath: faker.system.filePath(),
        id: Id.create(c.name, c.type),
        isClass: Boolean(Math.floor(Math.random())),
    };
}
const appBitField = 0b000000001111;

describe('id resolution', () => {
    it('should resolve application commands correctly', () => {
        const modules = faker.helpers.multiple(createRandomCommandModules, {
            count: 20,
        });
        const metadata = modules.map(createMetadata);
        metadata.forEach((meta, idx) => {
            const associatedModule = modules[idx];
            const uid = Id.create(associatedModule.name!, associatedModule.type!);
            expect(meta.id).toBe(uid);
        });
    });
});
