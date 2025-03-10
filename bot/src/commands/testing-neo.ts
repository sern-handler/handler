import { CommandType, commandModule } from "@sern/handler";
import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

const informationRequestModal = new ModalBuilder()
  .setCustomId("information-request")
  .setTitle("More Information")
  .addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("command-name")
        .setLabel("Command Name")
        .setPlaceholder("The name of the command that this bug occurred on.")
        .setStyle(TextInputStyle.Short)
        .setMinLength(4)
        .setMaxLength(20)
        .setRequired(true)));

export default commandModule({
    type: CommandType.Slash,
    plugins: [],
    description: "A random test command.",
    execute: async (ctx) => {
        await ctx.interaction.showModal(informationRequestModal);

        await ctx.interaction
          .awaitModalSubmit({ time: 300_000 })
          .then(async (modal) => {
              modal.reply("thanks brody")
          })
          .catch(() => null);
  },
});

