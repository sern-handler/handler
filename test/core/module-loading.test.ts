import { describe, it, expect } from 'vitest'
import path from 'node:path'
import * as Files from '../../src/core/module-loading'
import { Module } from '../../src/types/core-modules'
import { AssertionError } from 'node:assert'
//TODO: mock fs?
describe('module-loading', () => {
    it('should get the filename of the commandmodule (linux, esm)', () => {
        const fname = "///home/pooba/Projects/sern/halibu/dist/commands/ping.js"
        const callsiteinfo = Files.parseCallsite(fname)
        expect(callsiteinfo.name).toBe("ping")
    })
    it('should get filename of commandmodule (linux, cjs)', () => {
        const fname = "file:///home/pooba/Projects/sern/halibu/dist/commands/ping.js"
        const callsiteinfo = Files.parseCallsite(fname)
        expect(callsiteinfo.name).toBe("ping")

    })
    it('should get the filename of the commandmodule (windows, cjs)', () => {
        //this test case is impossible on linux.
        if(process.platform == 'win32') {
            const fname = "C:\\pooba\\Projects\\sern\\halibu\\dist\\commands\\ping.js"
            const callsiteinfo = Files.parseCallsite(fname)
            expect(callsiteinfo.name).toEqual("ping");
        }
    })
    it('should get filename of commandmodule (windows, esm)', () => {
        //this test case is impossible on linux.
        if(process.platform == 'win32') {
            const fname = "file:///C:\\pooba\\Projects\\sern\\halibu\\dist\\commands\\ping.js"
            const callsiteinfo = Files.parseCallsite(fname)
            expect(callsiteinfo.name).toEqual("ping");
        }
        
    })

    it('should import a commandModule properly', async () => {
        const { module } = await Files.importModule<Module>(path.resolve("test", 'mockules', "module.ts"));
        expect(module.name).toBe('module')
    })
    it('should throw when failed commandModule import', async () => {
        try {
            await Files.importModule(path.resolve('test', 'mockules', 'failed.ts'))
        } catch(e) {
            expect(e instanceof AssertionError)
        }
    })
    it('should throw when failed commandModule import', async () => {
        try {
            await Files.importModule(path.resolve('test', 'mockules', 'failed.ts'))
        } catch(e) {
            expect(e instanceof AssertionError)
        }
    })

    it('reads all modules in mockules', async () => {
        const ps = [] as string[]
        for await (const fpath of Files.readRecursive(path.resolve('test', 'mockules'))) {
            ps.push(fpath)
        }
        expect(ps.length === 4)
    })

}) 
