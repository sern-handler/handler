# Sern Handler
<a href="https://www.npmjs.com/package/sern_handler">
<img src="https://img.shields.io/npm/v/sern_handler?maxAge=3600" alt="NPM version" /></a> <a href="https://www.npmjs.com/package/shandler"><img src="https://img.shields.io/npm/dt/sern_handler?maxAge=3600" alt="NPM downloads" /></a> <a href="https://www.npmjs.com/package/sern_handler"><img src="https://img.shields.io/badge/builds-stable" alt="Builds Passing"></a>

Sern automates and streamlines development your discord bot with new version compatibility and full customization.

-   A reincarnation of [this old project](https://github.com/jacoobes/sern_handler)

## Installation

```sh
npm install sern-handler
```
```sh
yarn add sern-handler
```
```sh
pnpm add sern-handler
```

## Basic Usage

#### [Typescript](https://www.typescriptlang.org/)
```ts
import { Client, Intents } from 'discord.js'
import { Sern } from 'sern-handler';
import { prefix, token } from '../src/secrets.json';

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

new Sern.Handler({
    client,
    prefix,
    commands : 'dist/commands',  // If using typescript, target your outDir/~
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
```
#### `ping.ts`
```ts
import  { Sern, Types } from "sern-handler";
import { Ok } from "ts-results";

export default  {
    alias: [],
    desc : "ping pong",
    visibility : "private",
    test : false,
    type: Sern.CommandType.SLASH | Sern.CommandType.TEXT,
    execute : async ({message, interaction} : Types.Context, args: Ok<string> ) => Ok("pong!")      

} as Sern.Module;
```

#### [JavaScript](https://www.javascript.com)
```js
import { Client, Intents } from 'discord.js';
import { Sern } from 'sern-handler';
import { prefix, token } from '../src/secrets.json';

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

new Sern.Handler({
    client,   
    prefix,   
    commands : 'dist/commands', 
    privateServers : [           
        {
            test : true,
            id: 'server-id'
        }
    ],
    init: async (handler) => {
        // Optional function to initialize anything else on bot startup
    },
});


client.login(token);
```
#### `ping.js`
```js
import { Sern, Types } from "sern-handler";
import { Ok } from "ts-results";

export default  {
    alias: [],
    desc : "ping pong",
    visibility : "private",
    test : false,
    type: Sern.CommandType.SLASH | Sern.CommandType.TEXT,
    execute : async ({message, interaction}, args) => Ok("pong!")      

};
```

## Links ![link](https://img.shields.io/badge/Coming-Soon-purple)

-   📑 Official Documentation
-   🎧 Discord Server  

## Contribute 😄

-   Pull up on [issues](https://github.com/jacoobes/Sern/issues) and tell me if there are bugs
-   All kinds of contributions are welcomed!
