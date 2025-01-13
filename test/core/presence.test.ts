import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Presence } from '../../src';
import * as Files from '../../src/core/module-loading'
import { presenceHandler } from '../../src/handlers/presence'

// Example test suite for the module function
describe('module function', () => {
  it('should return a valid configuration', () => {
    const config = Presence.module({
      inject: ['dependency1', 'dependency2'],
      execute: vi.fn(),
    });

    expect(config).toBeDefined();
    expect(config.inject).toEqual(['dependency1', 'dependency2']);
    expect(typeof config.execute).toBe('function');
  });
});


describe('of function', () => {
  it('should return a valid presence configuration without repeat and onRepeat', () => {
    const presenceConfig = Presence.of({
      status: 'online',
      afk: false,
      activities: [{ name: 'Test Activity' }],
      shardId: [1, 2, 3],
    }).once();

    expect(presenceConfig).toBeDefined();
    //@ts-ignore Maybe fix?
    expect(presenceConfig.repeat).toBeUndefined();
    //@ts-ignore Maybe fix?
    expect(presenceConfig.onRepeat).toBeUndefined();
    expect(presenceConfig).toMatchObject({
      status: 'online',
      afk: false,
      activities: [{ name: 'Test Activity' }],
      shardId: [1, 2, 3],
    });
  });

  it('should return a valid presence configuration with repeat and onRepeat', () => {
    const onRepeatCallback = vi.fn();
    const presenceConfig = Presence.of({
      status: 'idle',
      activities: [{ name: 'Another Test Activity' }],
    }).repeated(onRepeatCallback, 5000);

    expect(presenceConfig).toBeDefined();
    expect(presenceConfig.repeat).toBe(5000);
    expect(presenceConfig.onRepeat).toBe(onRepeatCallback);
    expect(presenceConfig).toMatchObject({
      status: 'idle',
      activities: [{ name: 'Another Test Activity' }],
    });
  });


})


describe('Presence module execution', () => {
    const mockExecuteResult = Presence.of({
        status: 'online',
    }).once();
  
    const mockModule = Presence.module({ 
        inject: [ '@sern/client'],
        execute: vi.fn().mockReturnValue(mockExecuteResult)
    })
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Files.importModule
        vi.spyOn(Files, 'importModule').mockResolvedValue({
          module: mockModule
        });


        
    }); 
    it('should set presence once.', async () => {
        const setPresenceMock = vi.fn();
        const mockPath = '/path/to/presence/config';
    
        await presenceHandler(mockPath, setPresenceMock);

        expect(Files.importModule).toHaveBeenCalledWith(mockPath);
        expect(setPresenceMock).toHaveBeenCalledOnce();
    })

})
