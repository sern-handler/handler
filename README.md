<div align="center">
  <img src="https://raw.githubusercontent.com/sern-handler/.github/main/banner.png" width="900px">
</div>

<h1 align="center">Handlers. Redefined.</h1>
<h4 align="center">A customizable, batteries-included, powerful discord.js framework to streamline bot development.</h4>

<div align="center" style="margin-top: 10px">
  <img src="https://img.shields.io/badge/open-source-brightgreen">
  <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/v/@sern/handler?maxAge=3600" alt="NPM version" /></a>
  <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/dt/@sern/handler?maxAge=3600" alt="NPM downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License MIT"></a>
  <a href="https://sern-handler.js.org"><img alt="docs.rs" src="https://img.shields.io/docsrs/docs"></a>
  <img alt="Lines of code" src="https://img.shields.io/badge/total%20lines-2k-blue">
</div>


## 📜 Installation

```sh
npm install @sern/handler
```

```sh
yarn add @sern/handler
```

```sh
pnpm add @sern/handler
```

## 👀 Quick Look

* Support for discord.js v14 and all interactions
* Hybrid commands
* lightweight and customizable
* ESM, CommonJS and TypeScript support
* A powerful cli and awesome community-made plugins

## 👶 Basic Usage

#### ` index.js (CommonJS)`

```js
// Import the discord.js Client and GatewayIntentBits
const { Client, GatewayIntentBits } = require('discord.js');

// Import Sern namespace
const { Sern } = require('@sern/handler');

// Our configuration file
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
const { CommandType } = require('@sern/handler');

exports.default = commandModule({
  name: 'ping',
  description: 'A ping pong command',
  type: CommandType.Slash,
  execute(ctx) {
    ctx.reply('pong!');
  }
});
```

See our [templates](https://github.com/sern-handler/templates) for TypeScript examples and more

## 💻 CLI

It is **highly encouraged** to use the [command line interface](https://github.com/sern-handler/cli) for your project. Don't forget to view it.

## 🔗 Links

- [Official Documentation and Guide](https://sern-handler.js.org)
- [Support Server](https://discord.com/invite/mmyCTnYtbF)

## 👋 Contribute

- Read our contribution [guidelines](https://github.com/sern-handler/handler) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and report bugs
- All kinds of contributions are welcomed.

## 🚈 Roadmap

You can check our [roadmap](https://github.com/sern-handler/roadmap) to see what's going to be added or patched in the future.
