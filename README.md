# SernHandler <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/v/@sern/handler?maxAge=3600" alt="NPM version" /></a>
<a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/dt/@sern/handler?maxAge=3600" alt="NPM downloads" /></a>
[![License: MIT](https://img.shields.io/badge/License-MIT-blavk.svg)](https://opensource.org/licenses/MIT)

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

See our [templates](https://github.com/sern-handler/tenplated) for TypeScript examples and more

## CLI

We are providing a [command line interface](https://github.com/sern-handler/cli) for better & easier bot developement. Don't forget to view it.

## Links

- **[Official Documentation](https://sern-handler.js.org)**
- **[Public Templates](https://github.com/sern-handler/templates)**
- **[Discord Server](https://discord.com/invite/Yvb7DnqjXX)**

## Contribute

- Read our contribution [guidelines](https://github.com/sern-handler/handler) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and tell us, if there are bugs
- All kinds of contributions are welcomed.

## Roadmap

You can check our [roadmap](https://github.com/sern-handler/roadmap) to see what's going to be added or patched in the future.

## Stats

![Alt](https://repobeats.axiom.co/api/embed/db7210a5cae806c7e54c0c5942b6be25e63ca5e4.svg "Feel free to contribute")
