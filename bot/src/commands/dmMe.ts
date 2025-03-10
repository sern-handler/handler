import { CommandType, commandModule } from "@sern/handler";

export default commandModule({
    type: CommandType.Modal,
    execute: (modal) => modal.reply('thanks')
});
