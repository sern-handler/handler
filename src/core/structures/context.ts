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
import { Result, Ok, Err, val, isOk } from './result';
import * as assert from 'assert';
import type { ReplyOptions } from '../../types/utility';
import { fmt } from '../functions'
import { SernError } from './enums';


/**
 * @since 1.0.0
 * Provides values shared between
 * Message and ChatInputCommandInteraction
 */
export class Context {
    
    get options() {
        if(this.isMessage()) {
            const [, ...rest] = fmt(this.message.content, this.prefix);
            return rest;
        } else {
            return this.interaction.options;
        }
    }
    

    protected constructor(protected ctx: Result<Message, ChatInputCommandInteraction>,
                          private __prefix?: string) { }
    public get prefix() {
        return this.__prefix;
    }
    public get id(): Snowflake {
        return val(this.ctx).id
    }

    public get channel() {
        return val(this.ctx).channel;
    }

    public get channelId(): Snowflake {
        return val(this.ctx).channelId;
    }
    
    /**
     * If context is holding a message, message.author
     * else, interaction.user
     */
    public get user(): User {
        if(isOk(this.ctx)) {
            return this.ctx.value.author;
        } else {
            return this.ctx.error.user;
        }
    }

    public get userId(): Snowflake {
        return this.user.id;
    }

    public get createdTimestamp(): number {
        return val(this.ctx).createdTimestamp;
    }

    public get guild() {
        return val(this.ctx).guild;
    }

    public get guildId() {
        return val(this.ctx).guildId;
    }
    /*
     * interactions can return APIGuildMember if the guild it is emitted from is not cached
     */
    public get member() {
        return val(this.ctx).member;
    }

    get message(): Message {
        if(isOk(this.ctx)) {
            return this.ctx.value;
        }
        throw Error(SernError.MismatchEvent);
    }
    public isMessage(): this is Context & { ctx: Result<Message, never> } {
        return isOk(this.ctx);
    }

    public isSlash(): this is Context & { ctx: Result<never, ChatInputCommandInteraction> } {
        return !this.isMessage();
    }

    get interaction(): ChatInputCommandInteraction {
        if(!isOk(this.ctx)) {
            return this.ctx.error;
        }
        throw Error(SernError.MismatchEvent);
    }


    public get client(): Client {
        return val(this.ctx).client;
    }

    public get inGuild(): boolean {
        return val(this.ctx).inGuild()
    }

    public async reply(content: ReplyOptions) {
        if(isOk(this.ctx)) {
            return this.ctx.value.reply(content as MessageReplyOptions)
        } else {
            interface FetchReply { fetchReply: true };
            return this.ctx.error.reply(content as InteractionReplyOptions & FetchReply)
        }
    }

    static wrap(wrappable: BaseInteraction | Message, prefix?: string): Context {
        if ('interaction' in wrappable) {
            return new Context(Ok(wrappable), prefix);
        }
        assert.ok(wrappable.isChatInputCommand(), "Context created with bad interaction.");
        return new Context(Err(wrappable), prefix);
    }
}
