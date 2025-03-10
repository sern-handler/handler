import {commandModule, CommandType,  controller, CommandInitPlugin, CommandControlPlugin } from '@sern/handler';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    UserSelectMenuBuilder,
} from "discord.js";
import { localize } from '@sern/localizer';

const plugin = CommandControlPlugin(() => {
    return controller.next({ a: 'from plugin1' });
});

const plugin2 = CommandControlPlugin(() => {
    return controller.next({ a: 'from plugin2' });
})

const updateDescription = (description: string) => {
  return CommandInitPlugin(() => {
    if(description.length > 100) {
        console.error("Description is invalid")
        return controller.stop("From updateDescription: description is invalid");
    }
    return controller.next({ description }); // continue to next plugin
  });
};

export default commandModule({
    type: CommandType.Slash,
    plugins: [localize()],
    description: 'A ping command I just updated',
    options: [
        str(name("asdfs"),
            description("sdfds"))
    ],
    execute: async (ctx, sdt) => {
        ctx.interaction
        const btn = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Click me")
            .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUIcmlja3JvbGw%3D')

        const editButton = new ButtonBuilder({
            customId: `btn/{"uid":"1061421834341462036"}`,
            label: "click me also",
            emoji: "🛠",
            style: ButtonStyle.Primary,
        });

        ctx.reply({ components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(btn, editButton),
            new ActionRowBuilder<UserSelectMenuBuilder>({
                components: [
                  new UserSelectMenuBuilder({
                    custom_id: "userselect",
                    placeholder: "select channel",
                    minValues: 1,
                  }),
                ],
              }),
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                  new ChannelSelectMenuBuilder({
                    custom_id: "channelselect",
                    placeholder: "select channel",
                    minValues: 1,

                  }),
            ),
            new ActionRowBuilder<RoleSelectMenuBuilder>({
                components: [
                  new RoleSelectMenuBuilder({
                    custom_id: "roleselect",
                    placeholder: "select role",
                    minValues: 1,
                  }),
                ],
              })
        ]})
    },
});


