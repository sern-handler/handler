import type { APIGuildMember } from 'discord-api-types/v9';
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
import { None, Option, Some } from 'ts-results';
import type { Nullish } from '../../types/handler';
import { ExternallyUsed } from '../utilities/externallyUsed';

function firstSome<T>(...args: Option<T>[]): Nullish<T> {
    for (const op of args) {
        if (op.some) return op.val;
    }
    return null;
}

//Could I refactor with Either monad?
/**
 * The Context class will provide values that are shared between
 * Message and ChatInputCommandInteraction
 *
 */
export default class Context {
    private constructor(
        private oMsg: Option<Message> = None,
        private oInterac: Option<ChatInputCommandInteraction> = None,
    ) {
        this.oMsg = oMsg;
        this.oInterac = oInterac;
    }

    @ExternallyUsed
    public get message() {
        return this.oMsg.unwrap();
    }

    @ExternallyUsed
    public get interaction() {
        return this.oInterac.unwrap();
    }

    @ExternallyUsed
    public get id(): Snowflake {
        return firstSome(
            this.oInterac.map(i => i.id),
            this.oMsg.map(m => m.id),
        )!;
    }

    @ExternallyUsed
    public get channel(): Nullish<TextBasedChannel> {
        return firstSome(
            this.oMsg.map(m => m.channel),
            this.oInterac.map(i => i.channel),
        );
    }

    @ExternallyUsed
    public get user(): User {
        return firstSome(
            this.oMsg.map(m => m.author),
            this.oInterac.map(i => i.user),
        )!;
    }

    @ExternallyUsed
    public get createdTimestamp(): number {
        return firstSome(
            this.oMsg.map(m => m.createdTimestamp),
            this.oInterac.map(i => i.createdTimestamp),
        )!;
    }

    @ExternallyUsed
    public get guild(): Guild {
        return firstSome(
            this.oMsg.map(m => m.guild),
            this.oInterac.map(i => i.guild),
        )!;
    }

    @ExternallyUsed
    public get guildId(): Snowflake {
        return firstSome(
            this.oMsg.map(m => m.guildId),
            this.oInterac.map(i => i.guildId),
        )!;
    }

    /*
     * interactions can return APIGuildMember if the guild it is emitted from is not cached
     */
    @ExternallyUsed
    public get member(): Nullish<GuildMember | APIGuildMember> {
        return firstSome(
            this.oMsg.map(m => m.member),
            this.oInterac.map(i => i.member),
        );
    }

    @ExternallyUsed
    public get client(): Client {
        return firstSome(
            this.oMsg.map(m => m.client),
            this.oInterac.map(i => i.client),
        )!;
    }

    @ExternallyUsed
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

    @ExternallyUsed
    public isEmpty() {
        return this.oMsg.none && this.oInterac.none;
    }

    //TODO: make this queueable
    @ExternallyUsed
    public reply(content: Omit<InteractionReplyOptions, 'fetchReply'> | ReplyMessageOptions) {
        return firstSome(
            this.oInterac.map(i => {
                return i.reply(content as InteractionReplyOptions).then(() => i.fetchReply());
            }),
            this.oMsg.map(m => {
                return m.reply(content as ReplyMessageOptions);
            }),
        )!;
    }
}
