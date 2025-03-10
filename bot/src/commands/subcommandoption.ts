import { commandModule, CommandType } from '@sern/handler';
import { ApplicationCommandOptionType } from 'discord.js';

export default commandModule({
	type: CommandType.Slash,
	description: 'A ping command',
	options: [
        {
		name: "art",
		type: ApplicationCommandOptionType.Subcommand,
		description: "Lists out information about an Animal Crossing artwork.",
		options: [
		    {
			name: "name",
			description: "The name of the artwork to lookup.",
			type: ApplicationCommandOptionType.String,
			autocomplete: true,
			required: true,
			command: {
                            async execute(ctx) {
                                await ctx.respond([{ name: 'art', value: 'first' }])
                            },
			},
		    },
		],
	},
	{
		name: "villager",
		type: ApplicationCommandOptionType.Subcommand,
		description: "Lists out information about an Animal Crossing villager.",
		options: [
			{
				name: "name",
				description: "The name of the villager to lookup.",
				type: ApplicationCommandOptionType.String,
				autocomplete: true,
				required: true,
				command: {
					onEvent: [],
					async execute(ctx) {
						await ctx.respond([{ name: 'villager', value: 'second' } ])
                                                },
				},
			},
		],
	    },
        ],
	execute: async (ctx) => {
	    const command = ctx.options.getSubcommand();
	    switch (command) {
		    case "art": {

                        ctx.reply('art');
			    break;
		    }
			case "villager": {
                            ctx.reply('vil');
				break;
			}
		}
	},
});
