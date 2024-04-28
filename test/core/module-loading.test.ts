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
    it('should get the filename of the commandmodule (linux, esm)', () => {
        const fname = "///home/pooba/Projects/sern/halibu/dist/commands/ping.js"
        const callsiteinfo = Files.parseCallsite(fname)
        expect(callsiteinfo.name).toBe("ping")
    })
    it('should get the filename of the commandmodule (windows, cjs)', () => {
        const fname = "C:\\pooba\\Projects\\sern\\halibu\\dist\\commands\\ping.js"
        const callsiteinfo = Files.parseCallsite(fname)
        expect(callsiteinfo.name).toEqual("ping");
    })
    it('should get filename of commandmodule (windows, esm)', () => {
        const fname = "file:///C:\\pooba\\Projects\\sern\\halibu\\dist\\commands\\ping.js"
        const callsiteinfo = Files.parseCallsite(fname)
        expect(callsiteinfo.name).toEqual("ping");
    })
   
}) 
