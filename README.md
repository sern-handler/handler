<div align="center">
  <img src="https://raw.githubusercontent.com/sern-handler/.github/main/sern-rounded.png" width="900px">
</div>

<h1 align="center">Sern - Handlers. Redefined.</h1>
<h4 align="center">A customizable, batteries-included, powerful discord.js framework to automate and streamline bot development</h4>

<div align="center" style="margin-top: 10px">
  <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/v/@sern/handler?maxAge=3600" alt="NPM version" /></a>
  <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/dt/@sern/handler?maxAge=3600" alt="NPM downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blavk.svg" alt="License MIT"></a>
</div>


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
const { defaultPrefix, token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

Sern.init({
    client,   
    defaultPrefix,   
    commands : 'src/commands',
});

client.login(token);
```

#### ` ping.js (CommonJS)`

```js
const { Sern, CommandType } = require('@sern/handler');

exports.default = {
    description: 'A ping pong command',
    type: CommandType.Slash,
    execute(ctx) {
        ctx.reply('pong!');
    }
  };
```

See our [templates](https://github.com/sern-handler/templates) for TypeScript examples and more

## CLI

It is **highly encouraged** to use the [command line interface](https://github.com/sern-handler/cli) for your project. Don't forget to view it.

## Links

- [Official Documentation](https://sern-handler.js.org)
- [Support Server](https://discord.com/invite/mmyCTnYtbF)

## Contribute

- Read our contribution [guidelines](https://github.com/sern-handler/handler) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and report bugs
- All kinds of contributions are welcomed.

## Roadmap

You can check our [roadmap](https://github.com/sern-handler/roadmap) to see what's going to be added or patched in the future.

`Copyright ©️ 2022 Team SernHandler`
