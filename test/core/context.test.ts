import { describe, vi, it, expect } from'vitest'
import { Context } from '../../src';
import { faker } from '@faker-js/faker'
describe('Context', () => {
    // Mocked message and interaction objects for testing
    const mockMessage = {
        id: 'messageId',
        channel: 'channelId',
        channelId: 'channelId',
        interaction: { 
            id: faker.string.uuid()
        },
        author: { id: 'userId' },
        createdTimestamp: 1234567890,
        guild: 'guildId',
        guildId: 'guildId',
        member: { id: 'memberId' },
        client: { id: 'clientId' },
        inGuild: vi.fn().mockReturnValue(true),
        reply: vi.fn(),
    };

    const mockInteraction = {
        id: 'interactionId',
        user: { id: 'userId' },
        channel: 'channelId',
        channelId: 'channelId',
        createdTimestamp: 1234567890,
        guild: 'guildId',
        guildId: 'guildId',
        fetchReply: vi.fn().mockResolvedValue({}),
        member: { id: 'memberId' },
        client: { id: 'clientId' },
        isChatInputCommand: vi.fn().mockResolvedValue(true),
        inGuild: vi.fn().mockReturnValue(true),
        reply: vi.fn().mockResolvedValue({}),
    };

    it('should create a context from a message', () => {
        //@ts-ignore
        const context = Context.wrap(mockMessage);
        expect(context).toBeDefined();
        expect(context.id).toBe('messageId');
    });
    it('should throw error if accessing interaction as message', () => {
        //@ts-ignore
        const context = Context.wrap(mockMessage);
        expect(context).toBeDefined();
        expect(() => context.interaction)
            .toThrowError('You cannot use message when an interaction fired or vice versa');

    })
     it('should throw error if accessing message as interaction', () => {
        //@ts-ignore
        const context = Context.wrap(mockInteraction);
        expect(context).toBeDefined();
        expect(() => context.message)
            .toThrowError('You cannot use message when an interaction fired or vice versa');

    })

    it('should create a context from an interaction', () => {
        //@ts-ignore
        const context = Context.wrap(mockInteraction);
        expect(context).toBeDefined();
        expect(context.id).toBe('interactionId'); 
    });

    it('should reply to a context with a message', async () => {
        //@ts-ignore
        const context = Context.wrap(mockMessage);
        const replyOptions = { content: 'Hello, world!' };
        await context.reply(replyOptions);
        expect(mockMessage.reply).toHaveBeenCalledWith(replyOptions);
    });

    it('should reply to a context with an interaction', async () => {
        //@ts-ignore
        const context = Context.wrap(mockInteraction);
        const replyOptions = { content: 'Hello, world!' };
        await context.reply(replyOptions);
        expect(mockInteraction.reply).toHaveBeenCalledWith(replyOptions);
    });

});
