import { describe, it, expect } from 'vitest'
import { faker } from '@faker-js/faker'
import * as Files from '../../src/core/module-loading'
describe('module-loading', () => {
    it('should properly extract filename from file, nested once', () => {
        const extension = faker.system.fileExt()
        const name = faker.system.fileName({ extensionCount: 0 })
        const filename = Files.fmtFileName(name+'.'+extension);
        expect(filename).toBe(name)
    })
    it('should get the filename of the commandmodule (linux)', () => {
        const fname = "///home/pooba/Projects/sern/halibu/dist/commands/ping.js"
        expect(Files.parseCallsite(fname)).toBe("ping")
    })
    it('should get the filename of the commandmodule (windows)', () => {
        //const fname = "C:\\pooba\\Projects\\sern\\halibu\\dist\\commands\\ping.js"
        //expect(Files.parseCallsite(fname)).toBe("ping")
    })
   
}) 
