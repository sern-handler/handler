import { commandModule, CommandType } from "@sern/handler";
import { ActionRowBuilder, ApplicationCommandOptionType, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export default commandModule({
        type: CommandType.Slash,
        description : 'a ping command',
        options: [
            {
                name: "nest",
                description: "testing nested",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options : [
                    {
                        name: "nest",
                        description: "testing nested",
                        type: ApplicationCommandOptionType.Subcommand,
                        options : [
                            {
                                name: "sdfasd",
                                description: "testing autocomplete",
                                autocomplete: true,
                                type: ApplicationCommandOptionType.String,
                                command : {
                                    onEvent : [],
                                    async execute(autocmp, sdt) {
                                        //console.log(autocmp)
                                        const choices = ['butt', 'deez', 'lmao', 'lmfao', 'nuts', 'chicken'];
                                        await autocmp.respond(choices.map((e,i) => ({ name : e, value: i.toString()})));
                                    }
                                }
                            }
                        ]
                    },
                ]
            },
        ],
        async execute ({ interaction }) {
            const modal = new ModalBuilder()
			.setCustomId('dmMe')
			.setTitle('send something to my dm (nothing bad pls)');

            const input = new TextInputBuilder()
			.setCustomId('message')
			.setLabel("Send something to me")
			.setStyle(TextInputStyle.Short);

            const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents([input]);
            modal.addComponents([firstActionRow]);
            await interaction.showModal(modal);
        }
});

