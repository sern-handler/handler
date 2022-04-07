import type {
  Awaitable,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Message,
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

export default class Context {
  private constructor(
    private oMsg: Option<Message> = None,
    private oInterac: Option<ChatInputCommandInteraction> = None,
  ) {
    this.oMsg = oMsg;
    this.oInterac = oInterac;
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
  public get message() {
    return this.oMsg.unwrap();
  }
  public get interaction() {
    return this.oInterac.unwrap();
  }

  public get id(): Snowflake {
    return firstSome(
      this.oInterac.map((i) => i.id),
      this.oMsg.map((m) => m.id),
    )!;
  }
  public get channel(): Nullish<TextBasedChannel> {
    return firstSome(
      this.oMsg.map((m) => m.channel),
      this.oInterac.map((i) => i.channel),
    );
  }
  public get user(): User {
    return firstSome(
      this.oMsg.map((m) => m.author),
      this.oInterac.map((i) => i.user),
    )!;
  }
  public get createdTimestamp(): number {
    return firstSome(
      this.oMsg.map((m) => m.createdTimestamp),
      this.oInterac.map((i) => i.createdTimestamp),
    )!;
  }

  public get guild(): Guild {
    return firstSome(
      this.oMsg.map((m) => m.guild!),
      this.oInterac.map((i) => i.guild),
    )!;
  }
  public get guildId(): Snowflake {
    return firstSome(
      this.oMsg.map((m) => m.guildId),
      this.oInterac.map((i) => i.guildId),
    )!;
  }
  public get member(): Nullish<GuildMember> {
    return firstSome(
      this.oMsg.andThen((m) => Some(m.member!)),
      this.oInterac.andThen((i) => (i.inCachedGuild() ? Some(i.member) : None)),
    );
  }
  /*
   * Returns the underlying Context but allows for doing other operations
   */
  public onInteraction(onInteraction: (interaction: ChatInputCommandInteraction) => Awaitable<void>): Context {
    this.oInterac.map(onInteraction);
    return this;
  }
  public onMessage(onMessage: (message: Message) => Awaitable<void>): Context {
    this.oMsg.map(onMessage);
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
}
