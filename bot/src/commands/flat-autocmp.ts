import { commandModule, CommandType } from "@sern/handler";
import { ApplicationCommandOptionType } from "discord.js";

export default commandModule({
  description: "testing",
  type: CommandType.Slash,
  options: [
    {
      name: "option",
      description: "option desc",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
      command: {
        execute: (i) => {
          i.respond([{ name: "rah", value: "rah" }]);
        },
      },
    },
  ],
  execute: (ctx) => {
    return ctx.reply("rah");
  },
});
