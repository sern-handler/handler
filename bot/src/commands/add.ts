import { CommandType, commandModule } from "@sern/handler";
import { ApplicationCommandOptionType } from "discord.js";

export default commandModule({
	name: 'add',
	type: CommandType.Slash,
	description: 'Adds numbers together',
	options: [
	    {
		type: ApplicationCommandOptionType.String,
		name: 'numbers',
		description: 'Numbers to add together separated by a space.',
		required: true,
		min_length: 3,
            },
	],
	execute: async (ctx) => {
		let numbers = ctx.options.getString('numbers')?.split(' ')!;

		numbers = numbers.filter((num) => num !== '');

		if (!numbers.every((num) => !isNaN(parseFloat(num)))) {
			return ctx.reply({
				content: 'You can only input numbers.',
				ephemeral: true,
			});
		}

		const sum = numbers.reduce((acc, num) => acc + parseFloat(num), 0);


		return ctx.reply({
		    content: `The sum is ${sum}`,
		    ephemeral: true,
		});
	},
});
