import type {
    ChatInputCommandInteraction,
    Client,
    InteractionReplyOptions,
    Message,
    Snowflake,
    MessageReplyOptions,
    User,
} from 'discord.js';
import { Result as Either, Ok as Left, Err as Right } from 'ts-results-es';
import type { ReplyOptions } from '../../types/handler';
import { SernError } from './errors';

function safeUnwrap<T>(res: Either<T, T>) {
    return res.val;
}
/**
 * @since 1.0.0
 * Provides values shared between
 * Message and ChatInputCommandInteraction
 */
export default class Context {
    private constructor(private ctx: Either<Message, ChatInputCommandInteraction>) {}

    /**
     * Getting the Message object. Crashes if module type is
     * CommandType.Slash or the event fired in a Both command was
     * ChatInputCommandInteraction
     */
    public get message() {
        return this.ctx.expect(SernError.MismatchEvent);
    }
    /**
     * Getting the ChatInputCommandInteraction object. Crashes if module type is
     * CommandType.Text or the event fired in a Both command was
     * Message
     */
    public get interaction() {
        return this.ctx.expectErr(SernError.MismatchEvent);
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
    public isMessage() {
        return this.ctx.map(() => true).unwrapOr(false);
    }

    public isSlash() {
        return !this.isMessage();
    }

    static wrap(wrappable: ChatInputCommandInteraction | Message): Context {
        if ('token' in wrappable) {
            return new Context(Right(wrappable));
        }
        return new Context(Left(wrappable));
    }

    public reply(content: ReplyOptions) {
        return safeUnwrap(
            this.ctx
                .map(m => m.reply(content as string | MessageReplyOptions))
                .mapErr(i =>
                    i.reply(content as string | InteractionReplyOptions).then(() => i.fetchReply()),
                ),
        );
    }
}
