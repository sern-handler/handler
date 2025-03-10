import 'dotenv/config';
import { makeDependencies, Sern, Service } from '@sern/handler'
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { Publisher } from '@sern/publisher'
import { Localization } from '@sern/localizer'

__DEV__: console.log(1);

const intents = GatewayIntentBits.Guilds |
                GatewayIntentBits.GuildMembers |
                GatewayIntentBits.GuildMessageReactions |
                GatewayIntentBits.GuildMessages |
                GatewayIntentBits.DirectMessages |
                GatewayIntentBits.MessageContent;

const partials = [
    Partials.Channel 
];

async function init() {
    await makeDependencies(({ add }) => {
        add('@sern/client', new Client({ intents, partials }));
        add('localizer', Localization());
        add('publisher', deps => {
            return new Publisher(deps['@sern/modules'],
                                 deps['@sern/emitter'],
                                 deps['@sern/logger']!) 
        })
    })
    Sern.init({
        commands : "./dist/commands",
        events: "./dist/events",
        tasks: "./dist/tasks",
        defaultPrefix: "!"
    })
}
init().then(() => {
    Service('@sern/client').login()
})
//View docs for all options

