# Sern

Sern automates and streamlines development your discord bot with new version compatibility and full customization.

-   A reincarnation of [this old project](https://github.com/jacoobes/sern_handler)

## Installation

```sh
npm install sern-handler
```

```sh
yarn add sern-handler
```

# Basic Usage

### [Typescript](https://www.typescriptlang.org/)

```ts
import { Client } from 'discord.js';
import { Intents } from 'discord.js';
import { prefix, token } from '../src/secrets.json';
import { Sern } from 'sern-handler';

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
});

new Sern.Handler({
    client,
    prefix,
    commands: 'dist/commands', // after compiling with tsc 
    privateServers: [
        {
            test: true,
            id: 'server id',
        },
    ],
    init: async (handler: Sern.Handler) => {
        /* An optional function to initialize anything else on bot startup */
    },
});

client.login(token);
```

## Links ![link](https://img.shields.io/badge/Coming-Soon-orange)

-   📑 Official Documentation
-   🎧 Discord Server  

## Contribute 😄

-   Pull up on [issues](https://github.com/jacoobes/Sern/issues) and tell me if there are bugs
-   All kinds of contributions are welcomed!
