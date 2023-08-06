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

    
//    todo: handle commands with multiple extensions
//    it('should properly extract filename from file, nested multiple', () => {
//        const extension = faker.system.fileExt()
//        const extension2 = faker.system.fileExt()
//        const name = faker.system.fileName({ extensionCount: 0 })
//        const filename = Files.fmtFileName(name+'.'+extension+'.'+extension2);
//        console.log(filename, name)
//        expect(filename).toBe(name)
//
//    })
}) 
