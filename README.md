# Sern

Sern is making easier to create & automate your discord bot with new version compatibility and full customization.

- A reincarnation of [this old project](https://github.com/jacoobes/sern_handler)

# Installation

```sh
npm install sern-handler
```

```sh
yarn add sern-handler
```

# Basic Usage

TypeScript or JavaScript
```js
import { Client, Intents } from 'discord.js';
import { Handler } from 'sern-handler';
import { prefix, token } from '../src/secrets.json';

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

// Access handler anywhere
client.handler = new Handler({
    client,   
    prefix,   
    commands : 'dist/commands', 
    privateServers : [           
        {
            test : true,
            id: 'server-id'
        }
    ],
    init: async (handler : Sern.Handler) => {
        // Optional function to initialize anything else on bot startup
    },
});


client.login(token);
```

# Links

- 📑 [Official Documentation](https://sernhandler.js.org)
- 🎧 [Discord Server](https://discord.gg/QWQWQWQ)

# Contribute
- Pull up on issues and tell me if there are bugs.
- Check issues.
- Any contributions are open to suggestion!
