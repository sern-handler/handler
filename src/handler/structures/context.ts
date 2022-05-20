import type { APIGuildMember } from 'discord-api-types/v9';
import type {
    Awaitable,
    ChatInputCommandInteraction,
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

function firstSome<T>(...args: Option<T>[]): Nullish<T> {
    for (const op of args) {
        if (op.some) return op.val;
    }
    return null;
}

//
//Will need refactoring after applying context in practice
//
export default class Context {
    private constructor(
        private oMsg: Option<Message> = None,
        private oInterac: Option<ChatInputCommandInteraction> = None,
    ) {
        this.oMsg = oMsg;
        this.oInterac = oInterac;
    }

    public get message() {
        return this.oMsg.unwrap();
    }

    public get interaction() {
        return this.oInterac.unwrap();
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

    static wrap(wrappable: ChatInputCommandInteraction | Message): Context {
        if ('token' in wrappable) {
            return new Context(None, Some(wrappable));
        }
        return new Context(Some(wrappable), None);
    }

    public isEmpty() {
        return this.oMsg.none && this.oInterac.none;
    }

    /*
     * Returns the underlying Context but allows for doing other operations
     */
    public onInteraction(onInteraction: (interaction: ChatInputCommandInteraction) => Awaitable<void>): Context {
        if (this.oInterac.some) {
            onInteraction(this.oInterac.val);
            return Context.wrap(this.oInterac.val);
        }
        return this;
    }

    public onMessage(onMessage: (message: Message) => Awaitable<void>): Context {
        if (this.oMsg.some) {
            onMessage(this.oMsg.val);
            return Context.wrap(this.oMsg.val);
        }
        return this;
    }

    public takeInteractionValue<T>(extract: (interaction: ChatInputCommandInteraction) => T): Nullish<T> {
        if (this.oInterac.none) return null;
        return extract(this.oInterac.val);
    }

    public takeMessageValue<T>(extract: (message: Message) => T): Nullish<T> {
        if (this.oMsg.none) return null;
        return extract(this.oMsg.val);
    }

    public reply(content: Omit<InteractionReplyOptions, 'fetchReply'> | ReplyMessageOptions): Promise<Context> {
        return firstSome(
            this.oInterac.map(async i => {
                await i.reply(content as InteractionReplyOptions);
                return new Context(Some((await i.fetchReply()) as Message), Some(i));
            }),
            this.oMsg.map(async m => {
                const reply = await m.reply(content as ReplyMessageOptions);
                return new Context(Some(reply), this.oInterac);
            }),
        )!;
    }
}
