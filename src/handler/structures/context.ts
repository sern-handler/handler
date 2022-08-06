import type { APIGuildMember } from 'discord-api-types/v10';
import type {
    ChatInputCommandInteraction,
    Client,
    Guild,
    GuildMember,
    InteractionReplyOptions,
    Message,
    ReplyMessageOptions,
    Snowflake,
    TextBasedChannel,
    User,
} from 'discord.js';
import { type Option, None, Some } from 'ts-results-es';
import type { Nullish } from '../../types/handler';
import { SernError } from './errors';

function firstSome<T>(...args: Option<T>[]): Nullish<T> {
    for (const op of args) {
        if (op.some) return op.val;
    }
    return null;
}

//Could I refactor with Either monad?
/**
 * Provides values shared between
 * Message and ChatInputCommandInteraction
 */
export default class Context {
    private constructor(
        private oMsg: Option<Message> = None,
        private oInterac: Option<ChatInputCommandInteraction> = None,
    ) {
        this.oMsg = oMsg;
        this.oInterac = oInterac;
    }

    /**
     * Getting the Message object. Crashes if module type is
     * CommandType.Slash or the event fired in a Both command was
     * ChatInputCommandInteraction
     */
    public get message() {
        return this.oMsg.expect(SernError.MismatchEvent);
    }
    /**
     * Getting the ChatInputCommandInteraction object. Crashes if module type is
     * CommandType.Text or the event fired in a Both command was
     * Message
     */
    public get interaction() {
        return this.oInterac.expect(SernError.MismatchEvent);
    }

    public get id(): Snowflake {
        return firstSome(
            this.oInterac.map(i => i.id),
            this.oMsg.map(m => m.id),
        )!;
    }

    public get channel(): Nullish<TextBasedChannel> {
        return firstSome(
            this.oMsg.map(m => m.channel),
            this.oInterac.map(i => i.channel),
        );
    }

    public get user(): User {
        return firstSome(
            this.oMsg.map(m => m.author),
            this.oInterac.map(i => i.user),
        )!;
    }

    public get createdTimestamp(): number {
        return firstSome(
            this.oMsg.map(m => m.createdTimestamp),
            this.oInterac.map(i => i.createdTimestamp),
        )!;
    }

    public get guild(): Guild {
        return firstSome(
            this.oMsg.map(m => m.guild),
            this.oInterac.map(i => i.guild),
        )!;
    }

    public get guildId(): Snowflake {
        return firstSome(
            this.oMsg.map(m => m.guildId),
            this.oInterac.map(i => i.guildId),
        )!;
    }

    /*
     * interactions can return APIGuildMember if the guild it is emitted from is not cached
     */
    public get member(): Nullish<GuildMember | APIGuildMember> {
        return firstSome(
            this.oMsg.map(m => m.member),
            this.oInterac.map(i => i.member),
        );
    }

    public get client(): Client {
        return firstSome(
            this.oMsg.map(m => m.client),
            this.oInterac.map(i => i.client),
        )!;
    }

    public get inGuild(): boolean {
        return firstSome(
            this.oMsg.map(m => m.inGuild()),
            this.oInterac.map(i => i.inGuild()),
        )!;
    }

    static wrap(wrappable: ChatInputCommandInteraction | Message): Context {
        if ('token' in wrappable) {
            return new Context(None, Some(wrappable));
        }
        return new Context(Some(wrappable), None);
    }

    public isEmpty() {
        return this.oMsg.none && this.oInterac.none;
    }
    //Make queueable
    public reply(
        content: string | Omit<InteractionReplyOptions, 'fetchReply'> | ReplyMessageOptions,
    ) {
        return firstSome(
            this.oInterac.map(i => {
                return i
                    .reply(content as string | InteractionReplyOptions)
                    .then(() => i.fetchReply());
            }),
            this.oMsg.map(m => {
                return m.reply(content as string | ReplyMessageOptions);
            }),
        )!;
    }
}
