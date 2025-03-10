import { CommandType, commandModule } from "@sern/handler";


export default commandModule({
    type: CommandType.Slash,
    description: 'shid',
    execute({ interaction }) {
        interaction.reply('hello')
    }


})
