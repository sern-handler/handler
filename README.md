# SernHandler

<a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/v/@sern/handler?maxAge=3600" alt="NPM version" /></a>
<a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/dt/@sern/handler?maxAge=3600" alt="NPM downloads" /></a>
[![License: MIT](https://img.shields.io/badge/License-MIT-blavk.svg)](https://opensource.org/licenses/MIT)

A customizable, batteries-included, powerful discord.js framework to automate and streamline your bot development.

- A reincarnation of [this old project](https://www.npmjs.com/package/sern_handler)

## Installation

```sh
npm install @sern/handler
```

```sh
yarn add @sern/handler
```
```

```sh
pnpm add @sern/handler
```

## Basic Usage

#### ` index.js (CommonJS)`

```js
const { Client, Intents } = require('discord.js');
const { Sern } = require('sern-handler');
const { defaultPrefix, token } = require('./config.json');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS
   ],
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

See [documentation](https://sern-handler.js.org) for TypeScript examples and more

## Links

- [Official Documentation](https://sern-handler.js.org)
- [Support Server](https://discord.com/invite/Yvb7DnqjXX)

## Contribute

- Read our contribution [guidelines](https://github.com/sern-handler/handler) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and report bugs
- All kinds of contributions are welcomed.

## Roadmap

You can check our [roadmap](https://github.com/sern-handler/roadmap) to see what's going to be added or patched in the future.