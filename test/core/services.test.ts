import { SpyInstance, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CoreContainer } from '../../src/core/structures/container'
import { DefaultLogging } from "../../src/core";
import { faker } from '@faker-js/faker'
import { commandModule } from "../../src";
import { uniqueId } from '../../src/handler/id'
import { CommandMeta } from "../../src/core/types/modules";

describe('services', () => {
    //@ts-ignore
    let container: CoreContainer<Dependencies>; 
    let consoleMock : SpyInstance;   
    beforeEach(() => {
        container = new CoreContainer() 
        container.add({ '@sern/logger': () => new DefaultLogging() })
        container.ready()
        consoleMock = vi.spyOn(container.get('@sern/logger'), 'error').mockImplementation(() => {})
    })
    
    afterAll(() => {
        consoleMock.mockReset()
    });
    it('module-store.ts', async () => {
       function createRandomCommandModules() {
            return commandModule({
                type: faker.number.int({ min: 1<<0, max: 1<<10 }),
                description: faker.string.alpha(),
                name: faker.string.alpha(),
                execute: ()=>{}
            })
       }

       const modules = faker.helpers.multiple(createRandomCommandModules, { count: 40 })
      
       const paths =  faker.helpers.multiple(faker.system.directoryPath, { count: 40 })
        .map((path,i) => `${path}/${modules[i]}.js`);

       const metadata: CommandMeta[] = modules.map((cm, i) => ({
           id: cm.name+'_'+uniqueId(cm.type),
           isClass: false,
           fullPath: `${paths[i]}/${cm.name}.js` 
       }));
       const moduleManager = container.get('@sern/modules');
       let i =0;
       for(const m of modules) {
        moduleManager.set(m.name+'_'+uniqueId(m.type), paths[i]);
        moduleManager.setMetadata(m, metadata[i]);
        i++
      }
      for(const m of modules) {
        expect(moduleManager.getMetadata(m), "module references do not exist").toBeDefined() 
      }
       
    })

    //todo add more
    it('error-handling', () => {
        const errorHandler = container.get('@sern/errors');
        expect(() => errorHandler.crash(new Error("poo"))).toThrowError();
        
    })
    //todo add more, spy on every instance?
    it('logger', () => {

        container.get('@sern/logger').error({ message: 'error' })

        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith({ message: 'error' })
    })

    
    
})
