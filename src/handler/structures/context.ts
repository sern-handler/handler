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
        return safeUnwrap(this.ctx.map(m => m.id).mapErr(i => i.id));
    }

    public get channel() {
        return safeUnwrap(this.ctx.map(m => m.channel).mapErr(i => i.channel));
    }
    /**
     * If context is holding a message, message.author
     * else, interaction.user
     */
    public get user(): User {
        return safeUnwrap(this.ctx.map(m => m.author).mapErr(i => i.user));
    }

    public get createdTimestamp(): number {
        return safeUnwrap(this.ctx.map(m => m.createdTimestamp).mapErr(i => i.createdTimestamp));
    }

    public get guild() {
        return safeUnwrap(this.ctx.map(m => m.guild).mapErr(i => i.guild));
    }

    public get guildId() {
        return safeUnwrap(this.ctx.map(m => m.guildId).mapErr(i => i.guildId));
    }

    /*
     * interactions can return APIGuildMember if the guild it is emitted from is not cached
     */
    public get member() {
        return safeUnwrap(this.ctx.map(m => m.member).mapErr(i => i.member));
    }

    public get client(): Client {
        return safeUnwrap(this.ctx.map(m => m.client).mapErr(i => i.client));
    }

    public get inGuild(): boolean {
        return safeUnwrap(this.ctx.map(m => m.inGuild()).mapErr(i => i.inGuild()));
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
