import { ApplicationCommandOptionType } from "discord.js";
import { Service, commandModule, CommandType } from "@sern/handler";

export const config = {
    guildIds: ['941002690211766332']
}


export default commandModule({
    type: CommandType.Both,
    description: 'tests context',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "hello",
            description: "wassup",
            required: false,
        }
    ],
    async execute(ctx) {
        const logger = Service('@sern/logger');

        if(ctx.isMessage()) {
            logger?.info({ message : ctx.message.content  })
            logger?.info({ message : ctx.prefix  })
        } else {
            logger?.info({ message : ctx.interaction.toString() })
        }

        logger?.info({ message: ctx.id })
        logger?.info({ message: ctx.channel?.toString()! })
        logger?.info({ message: ctx.user.toString()! })
        logger?.info({ message: ctx.createdTimestamp.toString() })
        logger?.info({ message: ctx.guild?.toString() })
        logger?.info({ message: ctx.member?.toString() })
        logger?.info({ message: ctx.client })
        logger?.info({ message: ctx.inGuild })
        await ctx.reply("guayin bodishivatta")
    }
})
