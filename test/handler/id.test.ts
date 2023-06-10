import { describe, expect, it, vi }  from 'vitest';
import { createId } from '../../src/handler/id';
import { faker } from '@faker-js/faker';
import { CommandModule, CommandType, commandModule } from "../../src";
import { CommandTypeDiscordApi } from '../../src/handler/id';

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
            type: randomCommandType[Math.floor(Math.random()* randomCommandType.length)],
            description: faker.string.alpha(),
            name: faker.string.alpha(),
            execute: ()=>{}
        })
}
function createMetadata(c: CommandModule) {
        return {
            fullPath: faker.system.filePath(),
            id: createId(c.name, c.type),
            isClass: Boolean(Math.floor(Math.random()))
        }
}
const appBitField = 0b000000001111;

describe('id resolution', () => {
    
    it('should resolve application commands correctly', () => {
       const modules = faker.helpers.multiple(createRandomCommandModules, { count: 20 })
       const metadata = modules.map(createMetadata);
       metadata.forEach((meta, idx) => {
           const associatedModule = modules[idx];
           const am = (appBitField & associatedModule.type) !== 0 ? 'A' : 'C';
           let uid = 0;
           if(associatedModule.type === CommandType.Both || associatedModule.type === CommandType.Modal) {
                uid = 1;
           } else {
                uid = CommandTypeDiscordApi[Math.log2(associatedModule.type)]
           }
           expect(meta.id).toBe(associatedModule.name+"_"+am+uid)
       })
    })

    it("maps commands type to discord components or application commands", () => {
        expect(CommandTypeDiscordApi[Math.log2(CommandType.Text)]).toBe(1);

        expect(CommandTypeDiscordApi[1]).toBe(1);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.CtxUser)]).toBe(2);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.CtxMsg)]).toBe(3);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.Button)]).toBe(2);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.StringSelect)]).toBe(3);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.UserSelect)]).toBe(5);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.RoleSelect)]).toBe(6);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.MentionableSelect)]).toBe(7);
        expect(CommandTypeDiscordApi[Math.log2(CommandType.ChannelSelect)]).toBe(8);
        expect(CommandTypeDiscordApi[6]).toBe(1);

    });

})
