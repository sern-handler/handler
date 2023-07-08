import { describe, it, expect } from 'vitest'
import { CommandControlPlugin, CommandInitPlugin, EventControlPlugin, EventInitPlugin } from '../../src/core/create-plugins'
import { PluginType, controller } from '../../src'

describe('create-plugins', () => {
    it('should make proper control plugins', () => {
        const pl = EventControlPlugin(() => controller.next())
        expect(pl)
            .to.have.all.keys(['type', 'execute']) 
        expect(pl.type).toBe(PluginType.Control)
        expect(pl.execute).an('function')            
        const pl2 = CommandControlPlugin(() => controller.next())
        expect(pl2)
            .to.have.all.keys(['type', 'execute']) 
        expect(pl2.type).toBe(PluginType.Control)
        expect(pl2.execute).an('function')            

    })
    it('should make proper init plugins', () => {
        const pl = EventInitPlugin(() => controller.next())
        expect(pl)
            .to.have.all.keys(['type', 'execute']) 
        expect(pl.type).toBe(PluginType.Init)
        expect(pl.execute).an('function')

        const pl2 = CommandInitPlugin(() => controller.next())
        expect(pl2)
            .to.have.all.keys(['type', 'execute']) 
        expect(pl2.type).toBe(PluginType.Init)
        expect(pl2.execute).an('function')   
    })
   

})

