  export enum TimestampStyles {
    BOTH_LONG = 'F',
    BOTH_SHORT = 'f',
    DATE_LONG = 'D',
    DATE_SHORT = 'd',
    RELATIVE = 'R',
    TIME_LONG = 'T',
    TIME_SHORT = 't'
  }
  export function trueSlice(text: string, limit?: number): string {
    if (limit) {
      return new TextDecoder().decode(
        new TextEncoder().encode(text).slice(0, limit)
      );
    }
    return text;
  }
  export const Strings = {
    BOLD: '**',
    CODEBLOCK: '```',
    CODESTRING: '`',
    CODESTRING_DOUBLE: '``',
    ESCAPE: '\\',
    ITALICS: '_',
    SPOILER: '||',
    STRIKE: '~~',
    UNDERLINE: '__'
  };
  export const Regexes = {
    [Strings.BOLD]: /\*\*/g,
    [Strings.CODEBLOCK]: new RegExp(Strings.CODEBLOCK, 'g'),
    [Strings.CODESTRING]: new RegExp(Strings.CODESTRING, 'g'),
    [Strings.ESCAPE]: /\\/g,
    [Strings.ITALICS]: /(_|\*)/g,
    [Strings.SPOILER]: /\|\|/g,
    [Strings.STRIKE]: new RegExp(Strings.STRIKE, 'g'),
    [Strings.UNDERLINE]: new RegExp(Strings.UNDERLINE, 'g'),
    EVERYONE: /@(everyone|here)/g,
    LINK: /\]\(/g,
    MENTION: /<@([!&]?[0-9]{16,21})>/g,
    MENTION_HARDCORE: /@/g,
    URL: /\)/g
  };
  export const Replacements = {
    [Strings.BOLD]: '\\*\\*',
    [Strings.CODEBLOCK]: '``\u200b`',
    [Strings.CODESTRING]: '\\`',
    [Strings.ESCAPE]: '\\\\',
    [Strings.ITALICS]: '\\$1',
    [Strings.SPOILER]: '\\|\\|',
    [Strings.STRIKE]: '\\~\\~',
    [Strings.UNDERLINE]: '\\_\\_',
    MENTION: '\u200b'
  };
  export const EscapeBasic = (raw: string, key: keyof typeof Strings) =>
    raw.replace(Regexes[key], Replacements[key]);

  export const Escape: Record<string, typeof EscapeBasic> = (Object.keys(
    Strings
  ) as Array<keyof typeof Strings>).reduce(
    (p, v) =>
      Object.assign(p, { [Strings[v]]: (raw: string) => EscapeBasic(raw, v) }),
    {} as Record<string, typeof EscapeBasic>
  );

  export const FrozenTimestampStyles: Record<TimestampStyles, string> = {
    [TimestampStyles.BOTH_LONG]:
      '{day}, {month} {date}, {year} {hour}:{minute} {meridian}',
    [TimestampStyles.BOTH_SHORT]:
      '{month} {date}, {year} {hour}:{minute} {meridian}',
    [TimestampStyles.DATE_LONG]: '{month} {date}, {year}',
    [TimestampStyles.DATE_SHORT]: '{month_short}/{date}/{year}',
    [TimestampStyles.RELATIVE]: '{raw}',
    [TimestampStyles.TIME_LONG]: '{hour}:{minute}:{second} {meridian}',
    [TimestampStyles.TIME_SHORT]: '{hour}:{minute} {meridian}'
  };
  export interface Timestamp {
    raw: Date;
    month: string;
    month_short: string;
    date: string;
    year: string;
    second: string;
    meridian: 'AM' | 'PM';
    hour: string;
    minute: string;
    day: string;
  }
  export const Days: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };
  export const Months: Record<number, string> = {
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December'
  };
  export function formatDate(date: Date): Timestamp {
    return {
      raw: date,
      date: date
        .getDate()
        .toString()
        .padStart(2, '0'),
      day: Days[date.getDay()],
      hour: date
        .getHours()
        .toString()
        .padStart(2, '0'),
      meridian: date.getHours() > 12 ? 'PM' : 'AM',
      minute: date
        .getMinutes()
        .toString()
        .padStart(2, '0'),
      month: Months[date.getMonth()],
      month_short: (date.getMonth() + 1).toString().padStart(2, '0'),
      second: date
        .getSeconds()
        .toString()
        .padStart(2, '0'),
      year: date.getFullYear().toString()
    };
  }
  export function timestampToString(
    using: TimestampStyles,
    timestamp: Timestamp
  ) {
    let ret = FrozenTimestampStyles[using];
    for (let [key, value] of Object.entries(timestamp)) {
      ret = ret.split(`{${key}}`).join(value);
    }
    return ret;
  }
  export function freezeUnix(unix: number, style: TimestampStyles) {
    const date = new Date(unix);
    const timestamp = formatDate(date);
    let ret = FrozenTimestampStyles[style];
    for (let [key, value] of Object.entries(timestamp)) {
      ret = ret.split(`{${key}}`).join(value);
    }
    return ret;
  }
  export class FormatInner {
    public raw: string;
    public static: typeof FormatInner = FormatInner;
    constructor(raw: string | FormatInner) {
      if (raw instanceof FormatInner) {
        raw = raw.raw;
      }
      this.raw = raw;
    }
    toString() {
      return this.raw;
    }
    valueOf() {
      return this.raw;
    }
    italics() {
      return this.build('ITALICS', this.raw);
    }
    bold() {
      return this.build('BOLD', this.raw);
    }
    codestring() {
      const useDouble = this.raw.includes(Strings.CODESTRING);
      if (useDouble) {
        return this.codestringDouble();
      }
      return this.codestringSingle();
    }
    codestringDouble() {
      return this.build('CODESTRING_DOUBLE', this.raw);
    }
    codestringSingle() {
      return this.build('CODESTRING', this.raw);
    }
    codeblock(language?: string) {
      let full = '';
      if (language) {
        full += language + '\n';
      }
      full += this.raw;
      return this.build('CODEBLOCK', full);
    }
    spoiler() {
      return this.build('SPOILER', this.raw);
    }
    strike() {
      return this.build('STRIKE', this.raw);
    }
    underline() {
      return this.build('UNDERLINE', this.raw);
    }

    build(key: keyof typeof Strings, w: string) {
      const escaped = Escape[Strings[key]](w, key);
      const ret = this.static.wrap(escaped, Strings[key]);
      return new this.static(ret);
    }
    static wrap(raw: string, what: string) {
      return `${what}${raw}${what}`;
    }
  }
  export class Format extends FormatInner {
    static bold(text: string) {
      return new this(text).bold();
    }
    static build(text: string, key: keyof typeof Strings) {
      return new this(text).build(key, text);
    }
    static codeblock(text: string, language?: string) {
      return new this(text).codeblock(language);
    }
    static codestring(text: string) {
      return new this(text).codestring();
    }
    static codestringSingle(text: string) {
      return new this(text).codestringSingle();
    }
    static codestringDouble(text: string) {
      return new this(text).codestringDouble();
    }
    static italics(text: string) {
      return new this(text).italics();
    }
    static spoiler(text: string) {
      return new this(text).spoiler();
    }
    static strike(text: string) {
      return new this(text).strike();
    }
    static underline(text: string) {
      return new this(text).underline();
    }
    static timestamp(
      unix: number | Date | string,
      format: TimestampStyles = TimestampStyles.BOTH_SHORT,
      isSeconds: boolean = false
    ) {
      if (typeof unix === 'string') unix = Number(unix);
      if (unix instanceof Date) unix = unix.getTime();

      if (!isSeconds) {
        unix /= 1000;
      }
      unix = Math.floor(unix);
      return new this(`<t:${unix}:${format}>`);
    }
    static date(
      unix: number | Date | string,
      format: TimestampStyles = TimestampStyles.BOTH_SHORT,
      isSeconds: boolean = false
    ) {
      if (typeof unix === 'string') unix = Number(unix);
      if (unix instanceof Date) unix = unix.getTime();

      if (isSeconds) {
        unix *= 1000;
      }
      return new this(freezeUnix(unix, format));
    }
    static link(text: string, url: string | URL) {
      if (url instanceof URL) url = url.href;
      return new this(`[${text}](${url})`);
    }
  }
  export enum DiscordRegexNames {
    EMOJI = 'EMOJI',
    JUMP_CHANNEL = 'JUMP_CHANNEL',
    JUMP_CHANNEL_MESSAGE = 'JUMP_CHANNEL_MESSAGE',
    MENTION_CHANNEL = 'MENTION_CHANNEL',
    MENTION_ROLE = 'MENTION_ROLE',
    MENTION_USER = 'MENTION_USER',
    TEXT_BOLD = 'TEXT_BOLD',
    TEXT_CODEBLOCK = 'TEXT_CODEBLOCK',
    TEXT_CODESTRING = 'TEXT_CODESTRING',
    TEXT_ITALICS = 'TEXT_ITALICS',
    TEXT_SNOWFLAKE = 'TEXT_SNOWFLAKE',
    TEXT_SPOILER = 'TEXT_SPOILER',
    TEXT_STRIKE = 'TEXT_STRIKE',
    TEXT_UNDERLINE = 'TEXT_UNDERLINE',
    TEXT_URL = 'TEXT_URL'
  }
  export const DiscordRegex = {
    [DiscordRegexNames.EMOJI]: /<a?:(\w+):(\d+)>/g,
    [DiscordRegexNames.JUMP_CHANNEL]: /^(?:https?):\/\/(?:(?:(?:canary|ptb)\.)?(?:discord|discordapp)\.com\/channels\/)(\@me|\d+)\/(\d+)$/g,
    [DiscordRegexNames.JUMP_CHANNEL_MESSAGE]: /^(?:https?):\/\/(?:(?:(?:canary|ptb)\.)?(?:discord|discordapp)\.com\/channels\/)(\@me|\d+)\/(\d+)\/(\d+)$/g,
    [DiscordRegexNames.MENTION_CHANNEL]: /<#(\d+)>/g,
    [DiscordRegexNames.MENTION_ROLE]: /<@&(\d+)>/g,
    [DiscordRegexNames.MENTION_USER]: /<@(!?)(\d+)>/g,
    [DiscordRegexNames.TEXT_BOLD]: /\*\*([\s\S]+?)\*\*/g,
    [DiscordRegexNames.TEXT_CODEBLOCK]: /```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/gi,
    [DiscordRegexNames.TEXT_CODESTRING]: /`([\s\S]+?)`/g,
    [DiscordRegexNames.TEXT_ITALICS]: /_([\s\S]+?)_|\*([\s\S]+?)\*/g,
    [DiscordRegexNames.TEXT_SNOWFLAKE]: /(\d+)/g,
    [DiscordRegexNames.TEXT_SPOILER]: /\|\|([\s\S]+?)\|\|/g,
    [DiscordRegexNames.TEXT_STRIKE]: /~~([\s\S]+?)~~(?!_)/g,
    [DiscordRegexNames.TEXT_UNDERLINE]: /__([\s\S]+?)__/g,
    [DiscordRegexNames.TEXT_URL]: /((?:https?):\/\/[^\s<]+[^<.,:;"'\]\s])/g
  };
  export interface DiscordRegexMatch {
    animated?: boolean;
    channelId?: string;
    guildId?: string;
    id?: string;
    language?: string;
    matched: string;
    mentionType?: string;
    messageId?: string;
    name?: string;
    text?: string;
  }

  export interface DiscordRegexPayload<T extends DiscordRegexMatch> {
    match: {
      regex: RegExp;
      type: string;
    };
    matches: Array<T>;
  }

  export interface EmojiMatch extends DiscordRegexMatch {
    name: string;
    id: string;
    animated: boolean;
  }
  export interface JumpChannelMatch extends DiscordRegexMatch {
    guildId: string;
    channelId: string;
  }
  export interface JumpChannelMessageMatch extends JumpChannelMatch {
    messageId: string;
  }
  export interface MentionableMatch extends DiscordRegexMatch {
    id: string;
  }
  export interface MentionChannelMatch extends MentionableMatch {}
  export interface MentionRoleMatch extends MentionableMatch {}
  export interface MentionUserMatch extends MentionableMatch {
    mentionType: string;
  }
  export interface TextMatch extends DiscordRegexMatch {
    text: string;
  }
  export interface TextCodeblockMatch extends TextMatch {
    language: string;
  }
  export interface TextBoldMatch extends TextMatch {}
  export interface TextCodestringMatch extends TextMatch {}
  export interface TextItalicsMatch extends TextMatch {}
  export interface TextSnowflakeMatch extends TextMatch {}
  export interface TextSpoilerMatch extends TextMatch {}
  export interface TextStrikeMatch extends TextMatch {}
  export interface TextUnderlineMatch extends TextMatch {}
  export interface TextUrlMatch extends TextMatch {}

  export class MatchInner {
    public raw: string;
    public static: typeof MatchInner = MatchInner;

    constructor(raw: string) {
      this.raw = raw;
    }

    emoji(): DiscordRegexPayload<EmojiMatch> {
      return this.match(DiscordRegexNames.EMOJI);
    }
    jumpChannel(): DiscordRegexPayload<JumpChannelMatch> {
      return this.match(DiscordRegexNames.JUMP_CHANNEL);
    }
    jumpChannelMessage(): DiscordRegexPayload<JumpChannelMessageMatch> {
      return this.match(DiscordRegexNames.JUMP_CHANNEL_MESSAGE);
    }
    mentionChannel(): DiscordRegexPayload<MentionChannelMatch> {
      return this.match(DiscordRegexNames.MENTION_CHANNEL);
    }
    mentionRole(): DiscordRegexPayload<MentionRoleMatch> {
      return this.match(DiscordRegexNames.MENTION_ROLE);
    }
    mentionUser(): DiscordRegexPayload<MentionUserMatch> {
      return this.match(DiscordRegexNames.MENTION_USER);
    }
    codeblock(): DiscordRegexPayload<TextCodeblockMatch> {
      return this.match(DiscordRegexNames.TEXT_CODEBLOCK);
    }
    bold(): DiscordRegexPayload<TextBoldMatch> {
      return this.match(DiscordRegexNames.TEXT_BOLD);
    }
    codestring(): DiscordRegexPayload<TextCodestringMatch> {
      return this.match(DiscordRegexNames.TEXT_CODESTRING);
    }
    italics(): DiscordRegexPayload<TextItalicsMatch> {
      return this.match(DiscordRegexNames.TEXT_ITALICS);
    }
    snowflake(): DiscordRegexPayload<TextSnowflakeMatch> {
      return this.match(DiscordRegexNames.TEXT_SNOWFLAKE);
    }
    spoiler(): DiscordRegexPayload<TextSpoilerMatch> {
      return this.match(DiscordRegexNames.TEXT_SPOILER);
    }
    strike(): DiscordRegexPayload<TextStrikeMatch> {
      return this.match(DiscordRegexNames.TEXT_STRIKE);
    }
    underline(): DiscordRegexPayload<TextUnderlineMatch> {
      return this.match(DiscordRegexNames.TEXT_UNDERLINE);
    }
    url(): DiscordRegexPayload<TextUrlMatch> {
      return this.match(DiscordRegexNames.TEXT_URL);
    }

    match<T extends DiscordRegexMatch>(
      type: DiscordRegexNames,
      onlyFirst: boolean = false
    ): DiscordRegexPayload<T> {
      const regex = DiscordRegex[type];
      if (regex === undefined) {
        throw new global.Error(`Unknown regex type: ${type}`);
      }
      regex.lastIndex = 0;

      const payload: DiscordRegexPayload<T> = {
        match: { regex, type },
        matches: []
      };

      let match: RegExpExecArray | null = null;
      while ((match = regex.exec(this.raw))) {
        const result: DiscordRegexMatch = { matched: match[0] };
        switch (type) {
          case DiscordRegexNames.EMOJI:
            {
              result.name = match[1] as string;
              result.id = match[2] as string;
              result.animated = this.raw.startsWith('<a:');
            }
            break;
          case DiscordRegexNames.JUMP_CHANNEL:
            {
              result.guildId = match[1] as string;
              result.channelId = match[2] as string;
            }
            break;
          case DiscordRegexNames.JUMP_CHANNEL_MESSAGE:
            {
              result.guildId = match[1] as string;
              result.channelId = match[2] as string;
              result.messageId = match[3] as string;
            }
            break;
          case DiscordRegexNames.MENTION_CHANNEL:
          case DiscordRegexNames.MENTION_ROLE:
            {
              result.id = match[1] as string;
            }
            break;
          case DiscordRegexNames.MENTION_USER:
            {
              result.id = match[2] as string;
              result.mentionType = match[1] as string;
            }
            break;
          case DiscordRegexNames.TEXT_CODEBLOCK:
            {
              result.language = match[2] as string;
              result.text = match[3] as string;
            }
            break;
          case DiscordRegexNames.TEXT_BOLD:
          case DiscordRegexNames.TEXT_CODESTRING:
          case DiscordRegexNames.TEXT_ITALICS:
          case DiscordRegexNames.TEXT_SNOWFLAKE:
          case DiscordRegexNames.TEXT_SPOILER:
          case DiscordRegexNames.TEXT_STRIKE:
          case DiscordRegexNames.TEXT_UNDERLINE:
          case DiscordRegexNames.TEXT_URL:
            {
              result.text = match[1] as string;
            }
            break;
          default: {
            throw new global.Error(`Unknown regex type: ${type}`);
          }
        }
        payload.matches.push(result as T);

        if (onlyFirst) {
          break;
        }
      }
      regex.lastIndex = 0;
      return payload;
    }
  }
  export class Match extends MatchInner {
    static bold(raw: string) {
      return new this(raw).bold();
    }
    static codeblock(raw: string) {
      return new this(raw).codeblock();
    }
    static codestring(raw: string) {
      return new this(raw).codestring();
    }
    static emoji(raw: string) {
      return new this(raw).emoji();
    }
    static italics(raw: string) {
      return new this(raw).italics();
    }
    static jumpChannel(raw: string) {
      return new this(raw).jumpChannel();
    }
    static jumpChannelMessage(raw: string) {
      return new this(raw).jumpChannelMessage();
    }
    static match(
      raw: string,
      what: DiscordRegexNames,
      onlyFirst: boolean = false
    ) {
      return new this(raw).match(what, onlyFirst);
    }
    static mentionChannel(raw: string) {
      return new this(raw).mentionChannel();
    }
    static mentionRole(raw: string) {
      return new this(raw).mentionRole();
    }
    static mentionUser(raw: string) {
      return new this(raw).mentionUser();
    }
    static snowflake(raw: string) {
      return new this(raw).snowflake();
    }
    static spoiler(raw: string) {
      return new this(raw).spoiler();
    }
    static strike(raw: string) {
      return new this(raw).strike();
    }
    static underline(raw: string) {
      return new this(raw).underline();
    }
    static url(raw: string) {
      return new this(raw).url();
    }
  }
