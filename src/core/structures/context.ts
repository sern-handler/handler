import {
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

type ReplyOptions =
    | string
    | Omit<InteractionReplyOptions, 'fetchReply'>
    | MessageReplyOptions;

/**
 * @since 1.0.0
 * Provides values shared between
 * Message and ChatInputCommandInteraction
 */
export class Context extends CoreContext<Message, ChatInputCommandInteraction> {
    /*
     * @Experimental
     */
    get options() {
        return this.interaction.options;
    }
    protected constructor(protected ctx: Result<Message, ChatInputCommandInteraction>) {
        super(ctx);
    }

    public get id(): Snowflake {
        return this.ctx.val.id;
    }

    public get channel() {
        return this.ctx.val.channel;
    }
    /**
     * If context is holding a message, message.author
     * else, interaction.user
     */
    public get user(): User {
        return safeUnwrap(this.ctx.map(m => m.author).mapErr(i => i.user));
    }

    public get createdTimestamp(): number {
        return this.ctx.val.createdTimestamp;
    }

    public get guild() {
        return this.ctx.val.guild;
    }

    public get guildId() {
        return this.ctx.val.guildId;
    }
    /*
     * interactions can return APIGuildMember if the guild it is emitted from is not cached
     */
    public get member() {
        return this.ctx.val.member;
    }

    public get client(): Client {
        return this.ctx.val.client;
    }

    public get inGuild(): boolean {
        return this.ctx.val.inGuild();
    }

    public async reply(content: ReplyOptions) {
        return safeUnwrap(
            this.ctx
                .map(m => m.reply(content as string | MessageReplyOptions))
                .mapErr(i =>
                    i.reply(content as string | InteractionReplyOptions).then(() => i.fetchReply()),
                ),
        );
    }

    static override wrap(wrappable: BaseInteraction | Message): Context {
        if ('interaction' in wrappable) {
            return new Context(Ok(wrappable));
        }
        assert.ok(wrappable.isChatInputCommand());
        return new Context(Err(wrappable));
    }
}

function safeUnwrap<T>(res: Result<T, T>) {
    return res.val;
}
