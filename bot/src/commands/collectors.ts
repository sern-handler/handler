import { CommandType, Context, commandModule } from "@sern/handler";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default commandModule ({
    type: CommandType.Slash,
    description: 'collectors',
    execute: async (ctx) => {
        //await close(ctx)
        await testCollect(ctx)
    }
})

const testCollect = async (ctx: Context) => {
    const msgcmpt = ctx.interaction.channel?.createMessageComponentCollector()
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
	    new ButtonBuilder().setCustomId("closeyes").setLabel("Yes").setStyle(ButtonStyle.Success),
	    new ButtonBuilder().setCustomId("closeno").setLabel("No").setStyle(ButtonStyle.Danger)
    );
    ctx.reply({ components: [buttonRow] })
    msgcmpt?.on('collect', async button => {

	await button.deferUpdate();
        if (button.customId === "closeyes") {
		try {
                    await button.editReply('closing')
		} catch (e) {
		    await button.editReply({ content: "An error has occurred and I could not close the ticket...", components: [] });
		}
	} else {
		await button.editReply({ content: "This ticket will remain open.", components: [] });
		msgcmpt.stop();
	}
    });
}
//export const quiz = async(client: Client,  ctx: Context) => {
//	try {
//		const pokemon = Math.round(Math.random() * 890)
//		const question = `https://cdn.dagpi.xyz/wtp/pokemon/${pokemon}q.png`;
//		const answer = `https://cdn.dagpi.xyz/wtp/pokemon/${pokemon}a.png`;
//
//		const correctPokemon = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`)).json();
//		const allPokemon = await (await fetch("https://pokeapi.co/api/v2/pokemon?limit=899")).json();
//
//		const options: string[] = [];
//		//client.utils.log("WARNING", "INFO", `Correct answer is ${correctPokemon.name}`);
//
//		while (options.length < 9) {
//			let option = allPokemon.results[pokemon];
//			if (options.includes(option.name)) continue;
//			options.push(option.name);
//		}
//
//		if (!options.includes(correctPokemon.name)) {
//			options.splice(client.utils.randomRange(0, 10), 0, correctPokemon.name.toLowerCase());
//		} else {
//			while (options.length < 10) {
//				let option = allPokemon.results[client.utils.randomRange(1, 890)];
//				if (options.includes(option.name)) continue;
//				options.push(option.name);
//			}
//		}
//
//		const msgEmbed = (await client.utils.CustomEmbed({ userID: ctx.user.id })).setTitle("Who's that Pokémon?").setImage(question);
//		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
//			new StringSelectMenuBuilder().setCustomId("pokequiz").addOptions(
//				options.sort().map((opt) => {
//					return { label: client.utils.titleCase(opt), value: opt.toLowerCase() };
//				})
//			)
//		);
//
//		const msg = await client.utils.fetchReply(ctx.interaction, { embeds: [msgEmbed], components: [row] });
//		const filter = (i: StringSelectMenuInteraction) => i.user.id === ctx.user.id && i.message.id === msg.id;
//
//		const collector = msg.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 1000 * 20 });
//		collector.on("collect", async (i) => {
//			const guess = i.values[0].toLowerCase();
//
//			msgEmbed.setImage(answer).setTitle(`It's ${client.utils.titleCase(correctPokemon.name)}!`);
//
//			if (guess === correctPokemon.name.toLowerCase()) msgEmbed.setColor("Green").setFooter({ text: "You're correct!" });
//			else msgEmbed.setColor("Red").setFooter({ text: `You guessed ${client.utils.titleCase(guess)}.` });
//
//			await i.update({ embeds: [msgEmbed], components: [] });
//			collector.stop("Guessed");
//		});
//
//		collector.on("end", async (i, reason) => {
//			if (reason === "Guessed") return;
//
//			msgEmbed
//				.setImage(answer)
//				.setTitle(`It's ${client.utils.titleCase(correctPokemon.name)}!`)
//				.setColor("Red")
//				.setFooter({ text: "You did not guess in time." });
//
//			await ctx.interaction.editReply({ embeds: [msgEmbed], components: [] });
//		});
//	} catch (e) {
//		client.utils.log("ERROR", __filename, `${e}`);
//		return ctx.interaction.reply({ content: "An error has occurred. Please try again.", ephemeral: true });
//	}
//};
