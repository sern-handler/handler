import type {
    BaseInteraction,
    ChatInputCommandInteraction,
    Client,
    InteractionReplyOptions,
    Message,
    MessageReplyOptions,
    Snowflake,
    User,
} from 'discord.js';
import { CoreContext } from '../structures/core-context';
import { Result, Ok, Err } from 'ts-results-es';
import * as assert from 'assert';
import { ReplyOptions } from '../../types/utility';

function fmt(msg: string, prefix?: string): string[] {
    if(!prefix) throw Error("Unable to parse message without prefix");
    return msg.slice(prefix.length).trim().split(/\s+/g);
}

/**
 * @since 1.0.0
 * Provides values shared between
 * Message and ChatInputCommandInteraction
 */
export class Context extends CoreContext<Message, ChatInputCommandInteraction> {

    get options() {
        return this.interaction.options;
    }

    args(type: 'message'|'interaction', parser?: Function) {
        switch(type) {
            case 'message': {
                const [, ...rest] = fmt(this.message.content, this.prefix);
                return rest;
            };
            case 'interaction': {
                return this.interaction.options;
            };
        }
    }

    protected constructor(protected ctx: Result<Message, ChatInputCommandInteraction>,
                          public prefix?: string) {
        super(ctx);
    }

    public get id(): Snowflake {
        return safeUnwrap(this.ctx
                            .map(m => m.id)
                            .mapErr(i => i.id));
    }

    public get channel() {
        return safeUnwrap(this.ctx.map(m => m.channel).mapErr(i => i.channel));
    }

    public get channelId(): Snowflake {
        return safeUnwrap(this.ctx
                            .map(m => m.channelId)
                            .mapErr(i => i.channelId));
    }
    
    /**
     * If context is holding a message, message.author
     * else, interaction.user
     */
    public get user(): User {
        return safeUnwrap(this.ctx
                            .map(m => m.author)
                            .mapErr(i => i.user));
    }

    public get userId(): Snowflake {
        return this.user.id;
    }

    public get createdTimestamp(): number {
        return safeUnwrap(this.ctx 
                            .map(m => m.createdTimestamp)
                            .mapErr(i => i.createdTimestamp));
    }

    public get guild() {
        return safeUnwrap(this.ctx
                            .map(m => m.guild)
                            .mapErr(i => i.guild));
    }

    public get guildId() {
        return safeUnwrap(this.ctx
                            .map(m => m.guildId)
                            .mapErr(i => i.guildId));
    }
    /*
     * interactions can return APIGuildMember if the guild it is emitted from is not cached
     */
    public get member() {
        return safeUnwrap(this.ctx
                            .map(m => m.member)
                            .mapErr(i => i.member));
    }

    public get client(): Client {
        return safeUnwrap(this.ctx
                            .map(m => m.client)
                            .mapErr(i => i.client));
    }

    public get inGuild(): boolean {
        return safeUnwrap(this.ctx
                            .map(m => m.inGuild())
                            .mapErr(i => i.inGuild()));
    }

    public async reply(content: ReplyOptions) {
        return safeUnwrap(
            this.ctx
                .map(m => m.reply(content as MessageReplyOptions))
                .mapErr(i =>
                    i.reply(content as InteractionReplyOptions).then(() => i.fetchReply())),
        );
    }

    static wrap(wrappable: BaseInteraction | Message, prefix?: string): Context {
        if ('interaction' in wrappable) {
            return new Context(Ok(wrappable), prefix);
        }
        assert.ok(wrappable.isChatInputCommand(), "Context created with bad interaction.");
        return new Context(Err(wrappable), prefix);
    }
}

function safeUnwrap<T>(res: Result<T, T>) {
    if(res.isOk()) {
        return res.expect("Tried unwrapping message field: " + res)
    } 
    return res.expectErr("Tried unwrapping interaction field" + res)
}
