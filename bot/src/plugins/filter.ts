import {
  CommandControlPlugin,
  type CommandType,
  type Context,
  controller,
} from "@sern/handler";
import {
  GuildMember,
  GuildMemberRoleManager,
  PermissionResolvable,
  PermissionsBitField,
  User,
} from "discord.js";


export type Test = (context: Context) => boolean;

export class Criteria {
  public constructor(
    public readonly name: string,
    public readonly execute: Test,
    public readonly children: Array<Criteria>
  ) {}
  toString() {
    return this.name + ' ' + this.children.map(c => c.name).join(', ')
  }
}

export const or = (...filters: Array<FilterImpl>): FilterImpl => {
    function execute(context: Context): boolean {
      let pass = false;
      tests: for (const filter of filters) {
        if (filter.test(context)) {
          pass = true;
          break tests;
        }
      }

      return pass;
    }

    const children: Array<Criteria> = filters.map((x) => x.criteria);

    return new FilterImpl(
      new Criteria("or", execute, children),
      `or(${filters.map((x) => x.message).join(", ")})`
    );
}


export const and = (...filters: Array<FilterImpl>): FilterImpl => {
    function execute(context: Context): boolean {
      for (const filter of filters) {
        if (!filter.test(context)) {
          return false;
        }
      }

      return true;
    }

    const children: Array<Criteria> = filters.map((x) => x.criteria);

    return new FilterImpl(
      new Criteria("and", execute, children),
      `and(${filters.map((x) => x.message).join(", ")})`
    );

}


export const not = (filter: FilterImpl): FilterImpl => {
    function execute(context: Context): boolean {
      return !filter.test(context);
    }

    return new FilterImpl(
      new Criteria("not", execute, [filter.criteria]),
      `not(${filter.criteria})`
    );
  }
export const custom =(execute: Test, message?: string): FilterImpl => {
    return new FilterImpl(new Criteria("custom", execute, []), message);
}

export const withCustomMessage = (
    filter: FilterImpl,
    message?: string
): FilterImpl => {
    return new FilterImpl(filter.criteria, message);
}

export const hasGuildPermission = (
    permission: PermissionResolvable
): FilterImpl => {
    const b = PermissionsBitField.resolve(permission);
    const field = Object.entries(PermissionsBitField.Flags).find(
      ([, v]) => v === b
    );

    if (field === undefined) {
      throw new Error(
        `unknown permission \`${permission}\` in filter \`hasGuildPermission\``
      );
    }

    const [name] = field;

    function execute(context: Context): boolean {
      if (context.member !== null) {
        if (typeof context.member.permissions === "string") {
          return new PermissionsBitField(BigInt(context.member.permissions)).has(b);
        }
        return context.member.permissions.has(b);
      }

      return true;
    }

    return new FilterImpl(
      new Criteria("hasGuildPermission", execute, []),
      `has guild permission: ${name}`
    );
}
export const hasChannelPermission = (
    permission: PermissionResolvable,
    channelId?: string
  ): FilterImpl => {
    const b = PermissionsBitField.resolve(permission);
    const field = Object.entries(PermissionsBitField.Flags).find(
      ([, v]) => v === b
    );

    if (field === undefined) {
      throw new Error(
        `unknown permission \`${permission}\` in filter \`hasChannelPermission\``
      );
    }

    const [name] = field;

    function execute(context: Context): boolean {
      if (context.member !== null) {
        const channel =
          channelId !== undefined
            ? context.guild?.channels.cache.get(channelId)
            : context.channel;

        // ?
        if (channel == undefined || channel === null) {
          return false;
        }

        if (channel.isDMBased()) {
          return true;
        }

        const field2 = channel.permissionsFor(context.user);

        // assume we have no permission overrides
        if (field2 === null) {
          if (context.member !== null) {
            if (typeof context.member.permissions === "string") {
              return new PermissionsBitField(
                BigInt(context.member.permissions)
              ).has(b);
            }

            return context.member.permissions.has(b);
          }

          return false;
        }

        return field2.has(b);
      }

      return true;
    }

    return new FilterImpl(
      new Criteria("hasChannelPermission", execute, []),
      channelId !== undefined
        ? `has channel permission ${name} in <#${channelId}>`
        : `has channel permission ${name}`
    );
  }

export const canAddReactions =(channelId?: string): FilterImpl => {
    return hasChannelPermission("AddReactions", channelId);
}

export const canAttachFiles =(channelId?: string): FilterImpl => {
    return hasChannelPermission("AttachFiles", channelId);
}

export const canBanMembers = (): FilterImpl => {
    return hasGuildPermission("BanMembers");
}

export const canChangeNickname = (): FilterImpl => {
    return hasGuildPermission("ChangeNickname");
}

export const canConnect = (channelId?: string): FilterImpl => {
    return hasChannelPermission("Connect", channelId);
}

export const canCreateInstantInvite =(channelId?: string): FilterImpl => {
    return hasChannelPermission("CreateInstantInvite", channelId);
  }

export const canDeafenMembers =(channelId?: string): FilterImpl => {
    return hasChannelPermission("DeafenMembers", channelId);
  }

export const canEmbedLinks =(channelId?: string): FilterImpl => {
    return hasChannelPermission("EmbedLinks", channelId);
  }

export const canKickMembers =(): FilterImpl => {
    return hasGuildPermission("KickMembers");
  }

export const canManageChannelWebhooks =(channelId?: string): FilterImpl => {
    return hasChannelPermission("ManageWebhooks", channelId);
  }

export const canManageChannels =(channelId?: string): FilterImpl => {
    return hasChannelPermission("ManageChannels", channelId);
}

export const canManageEmojisAndStickers =(): FilterImpl => {
    return hasGuildPermission("ManageEmojisAndStickers");
}

export const canManageGuild =(): FilterImpl => {
    return hasGuildPermission("ManageGuild");
}

export const canManageGuildWebhooks =(): FilterImpl => {
    return hasGuildPermission("ManageWebhooks");
}

export const canManageMessages =(channelId?: string): FilterImpl => {
    return hasChannelPermission("ManageMessages", channelId);
}

export const canManageNicknames = (): FilterImpl => {
    return hasGuildPermission("ManageNicknames");
}

export const canManageRoles = (): FilterImpl => {
    return hasGuildPermission("ManageRoles");
}

export const canMentionEveryone = (channelId?: string): FilterImpl => {
    return hasChannelPermission("MentionEveryone", channelId);
  }

export const canMoveMembers = (channelId?: string): FilterImpl => {
    return hasChannelPermission("MoveMembers", channelId);
  }

export const canMuteMembers = (channelId?: string): FilterImpl => {
    return hasChannelPermission("MuteMembers", channelId);
  }

export const canPrioritySpeaker = (channelId?: string): FilterImpl => {
    return hasChannelPermission("PrioritySpeaker", channelId);
  }

export const canReadMessageHistory = (channelId?: string): FilterImpl => {
    return hasChannelPermission("ReadMessageHistory", channelId);
  }

export const canViewChannel = (channelId: string): FilterImpl => {
    return hasChannelPermission("ViewChannel", channelId);
  }

export const canSendMessages = (channelId: string): FilterImpl => {
    return hasChannelPermission("SendMessages", channelId);
  }

export const canSendTtsMessages = (channelId?: string): FilterImpl => {
    return hasChannelPermission("SendTTSMessages", channelId);
  }

export const canSpeak = (channelId?: string): FilterImpl => {
    return hasChannelPermission("Speak", channelId);
  }

export const canStream = (channelId?: string): FilterImpl => {
    return hasChannelPermission("Stream", channelId);
  }

export const canUseExternalEmojis = (channelId?: string): FilterImpl => {
    return hasChannelPermission("UseExternalEmojis", channelId);
  }

export const canUseVoiceActivity = (channelId?: string): FilterImpl => {
    return hasChannelPermission("UseVAD", channelId);
  }

export const canViewAuditLog = (): FilterImpl => {
    return hasGuildPermission("ViewAuditLog");
  }

export const canViewGuildInsights = (): FilterImpl => {
    return hasGuildPermission("ViewGuildInsights");
  }

export const channelIdIn = (channelIds: Array<string>): FilterImpl => {
    function execute(context: Context): boolean {
      return channelIds.includes(
        context.isMessage()
          ? context.message.channelId
          : context.interaction.channelId
      );
    }

    return new FilterImpl(
      new Criteria("channelIdIn", execute, []),
      `channel is one of: ${channelIds.map((v) => `<#${v}>`).join(", ")}`
    );
  }

export const hasEveryRole = (roles: Array<string>): FilterImpl => {
    return withCustomMessage(
      and(...roles.map((v) => hasRole(v))),
      `has all of: ${roles.map((v) => `<@&${v}>`).join(", ")}`
    );
  }

export const hasMentionableRole = (): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.member !== null) {
        if (context.member.roles instanceof GuildMemberRoleManager) {
          return (
            context.member.roles.cache.filter((x) => x.mentionable === true)
              .size > 0
          );
        }

        if (context.guild === null) {
          return false;
        }

        return context.member.roles
          .map((roleId) => context.guild!.roles.cache.get(roleId))
          .filter((x) => x !== undefined)
          .some((x) => x!.mentionable);
      }

      return false;
    }
    return new FilterImpl(
      new Criteria("hasMentionableRole", execute, []),
      "has a mentionable role"
    );
  }

export const hasNickname = (nickname?: string): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.member !== null) {
        if (context.member instanceof GuildMember) {
          if (nickname !== null) {
            return context.member.nickname === nickname;
          }

          return context.member.nickname !== null;
        }

        if (nickname !== null) {
          return context.member.nick === nickname;
        }

        return (
          context.member.nick !== null && context.member.nick !== undefined
        );
      }

      // dm members can technically have nicknames but they're per-user, so this should never be true.
      return false;
    }
    return new FilterImpl(new Criteria("hasNickname", execute, []), "has a nickname");
  }

export const hasParentId = (parentId: string): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.channel !== null) {
        if (context.channel.isDMBased()) {
          return false;
        }

        return context.channel.parentId === parentId;
      }

      return false;
    }

    return new FilterImpl(
      new Criteria("hasParentId", execute, []),
      `has channel parent <#${parentId}>`
    );
  }

export const hasRole = (roleId: string): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.member !== null) {
        if (context.member.roles instanceof GuildMemberRoleManager) {
          return context.member.roles.cache.has(roleId);
        }

        if (context.guild === null) {
          return false;
        }

        return context.member.roles.includes(roleId);
      }

      // assume dm members have every role ever.
      return true;
    }

    return new FilterImpl(
      new Criteria("hasRole", execute, []),
      `has role <@&${roleId}>`
    );
  }

export const hasSomeRole = (roles: Array<string>): FilterImpl => {
    return withCustomMessage(
      or(...roles.map((role) => hasRole(role))),
      `has any of: ${roles.map((v) => `<@&${v}>`).join(", ")}`
    );
  }

export const isAdministator = (): FilterImpl => {
    return hasGuildPermission("Administrator");
  }

export const isChannelId = (channelId: string): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.isMessage()) {
        return context.message.channelId === channelId;
      }

      return context.interaction.channelId === channelId;
    }

    return new FilterImpl(
      new Criteria("isChannelId", execute, []),
      `is channel <#${channelId}>`
    );
  }

export const isChannelNsfw = (): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.channel !== null) {
        if (context.channel.isDMBased() || context.channel.isThread()) {
          return false;
        }

        return context.channel.nsfw;
      }

      return false;
    }
    return new FilterImpl(
      new Criteria("isChannelNsfw", execute, []),
      "channel marked as nsfw"
    );
  }

export const isGuildOwner = (): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.guild !== null) {
        return context.guild.ownerId === context.user.id;
      }

      return true;
    }
    return new FilterImpl(
      new Criteria("isGuildOwner", execute, []),
      "is guild owner"
    );
  }

export const isBotOwner = (): FilterImpl => {
    function execute(context: Context): boolean {
      if (context.client.application !== null) {
        if (context.client.application.owner !== null) {
          if (context.client.application.owner instanceof User) {
            return context.user.id === context.client.application.owner.id;
          }

          return context.client.application.owner.members.has(context.user.id);
        }
      }

      // nope
      return false;
    }
    return new FilterImpl(new Criteria("isBotOwner", execute, []), "is bot owner");
  }

export const isUserId = (userId: string): FilterImpl => {
    function execute(context: Context): boolean {
      return context.user.id === userId;
    }
    return new FilterImpl(
      new Criteria("isUserId", execute, []),
      `is user: <@${userId}>`
    );
  }

export const parentIdIn = (parentIds: Array<string>): FilterImpl => {
    return withCustomMessage(
      or(...parentIds.map((v) => hasParentId(v))),
      `channel parent is one of: ${parentIds.map((v) => `<#${v}>`).join(", ")}`
    );
  }

export const userIdIn = (userIds: Array<string>): FilterImpl => {
    return withCustomMessage(
      or(...userIds.map((v) => isUserId(v))),
      `user is one of: ${userIds.map((v) => `<@${v}>`).join(", ")}`
    );
  }

export const isInGuild = (): FilterImpl => {
    function execute(context: Context): boolean {
      return context.guildId !== null;
    }

    return new FilterImpl(new Criteria("isInGuild", execute, []), "is in guild");
  }

export const isInDm = (): FilterImpl => {
    const notInGuild = compose(not, isInGuild);
    return withCustomMessage(notInGuild(), "is in dm");
}

export const never = (): FilterImpl => {
    function execute(context: Context): boolean {
      void context;
      return false;
    }
    return new FilterImpl(new Criteria("never", execute, []), "never");
}

export const always = (): FilterImpl => {
    function execute(context: Context): boolean {
      void context;
      return true;
    }
    return new FilterImpl(new Criteria("always", execute, []), "always");
}
type CtxMap<T> = (arg: T) => FilterImpl;

/**
  * Call FilterImpls in right to left order. 
  * @example 
  * import { compose, isUserId, not } from '../plugins/filter'
  * const isNotUserId = compose(not, isUserId)
  *
  */
export const compose = <T = void>(...funcs: CtxMap<any>[]): CtxMap<T> => {
    return (arg: T): FilterImpl => 
        //@ts-ignore
        funcs.reduceRight((result, func) => func(result), arg);
}


export class FilterImpl {
  public readonly test: Test;

  public constructor(
    public readonly criteria: Criteria,
    public message?: string
  ) {
    this.test = this.criteria.execute;
  }
}


export type FilterOptions = {
  condition: Array<FilterImpl> | FilterImpl,
  onFailed?: (context: Context, filters: Array<FilterImpl>) => unknown
};
/**
 * Generalized `filter` plugin. revised by jacoobes, all credit to original author.
 * Perform declarative conditionals as plugins.  
 * @author @trueharuu [<@504698587221852172>]
 * @version 2.0.0
 * @example 
 * import { filter, not, isGuildOwner, canMentionEveryone } from '../plugins/filter';
 * import { commandModule } from '@sern/handler';
 *
 * export default commandModule({
 *     plugins: filter({ condition: [not(isGuildOwner()), canMentionEveryone()] }),
 *     async execute(context) {
 *       // your code here
 *     }
 * });
 */

export const filter = 
  (options: FilterOptions) => {
    return CommandControlPlugin<CommandType.Both>(async (context) => {
      const arrayifiedCondition = Array.isArray(options.condition) ? options.condition : [options.condition]
      const value = and(...arrayifiedCondition).test(context);

      if (value) {
        return controller.next();
      }

      if (options.onFailed !== undefined) {
        await options.onFailed(context, arrayifiedCondition);
      } else {
        await context.reply({
          ephemeral: true,
          content: `you do not match the criteria for this command:\n${arrayifiedCondition
            .map((x) => x.message)
            .filter((x) => x !== undefined)
            .join("\n")}`,
          allowedMentions: {
            repliedUser: false,
            parse: [],
          },
        });
      }

      return controller.stop();
    });
  };
