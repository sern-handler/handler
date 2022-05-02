# Sern Handler

<a href="https://www.npmjs.com/package/@sern/handler">
<img src="https://img.shields.io/npm/v/@sern/handler?maxAge=3600" alt="NPM version" /></a> <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/dt/@sern/handler?maxAge=3600" alt="NPM downloads" /></a> <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/badge/builds-stable" alt="Builds Passing"></a>

A customizable, batteries-included, powerful discord.js framework to automate and streamline your bot development.


## Installation

```sh
npm install @sern/handler
```

```sh
yarn add @sern/handler
```

```sh
pnpm add @sern/handler
```

## Basic Usage

#### ` index.js (CommonJS)`

```js
const { Client, GatewayIntentBits } = require('discord.js');
const { Sern } = require('sern-handler');
const { prefix, token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

new Sern.Handler({
  client,
  prefix,
  commands: 'src/commands',
  privateServers: [
    {
      test: true,
      id: 'server-id',
    },
  ],
  init: async (handler) => {
    // Optional function to initialize anything else on bot startup
  },
});

client.login(token);
```

#### ` ping.js (CommonJS)`

```js
const { Sern, Types } = require('sern-handler');

module.exports = {
  alias: [],
  desc: 'A ping pong command',
  visibility: 'private',
  test: false,
  type: Sern.CommandType.SLASH | Sern.CommandType.TEXT,
  execute: async ({ message, interaction }, args) => 'pong!',
};
```

See [documentation](https://sern-handler.js.org) for TypeScript examples and more

## Links

- **[Official Documentation](https://sern-handler.js.org)**
- **[Public Templates](https://github.com/sern-handler/templates)**
- **[Discord Server](https://discord.com/invite/Yvb7DnqjXX)**

## Contribute

- Read our contribution [guidelines](https://github.com/sern-handler/handler) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and tell us, if there are bugs
- All kinds of contributions are welcomed!

## Roadmap

You can check our [roadmap](https://github.com/sern-handler/roadmap) to see what's going to be added or fixed in the future.
