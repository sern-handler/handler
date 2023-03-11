<div align="center">
  <img src="https://raw.githubusercontent.com/sern-handler/.github/main/banner.png" width="900px" />
</div>

<h1 align="center">Handlers. Redefined.</h1>
<h4 align="center">A complete, customizable, typesafe, & reactive framework for discord bots</h4>

<div align="center" styles="margin-top: 10px">
  <img src="https://img.shields.io/badge/open-source-brightgreen" />
  <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/v/@sern/handler?maxAge=3600" alt="NPM version" /></a>
  <a href="https://www.npmjs.com/package/@sern/handler"><img src="https://img.shields.io/npm/dt/@sern/handler?maxAge=3600" alt="NPM downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License MIT" /></a>
  <a href="https://sern.dev"><img alt="docs.rs" src="https://img.shields.io/docsrs/docs" /></a>
  <img alt="Lines of code" src="https://img.shields.io/badge/total%20lines-2k-blue" />
</div>

## Why?
- Most handlers don't support discord.js 14.7+
- Customizable commands
- Plug and play or customize to your liking
- Embraces reactive programming for consistent and reliable backend
- Customizable logger, error handling, and more
- Active development and growing [community](https://sern.dev/discord)
## 👀 Quick Look

* Support for discord.js v14 and all interactions
* Hybrid commands
* Lightweight and customizable
* ESM, CommonJS and TypeScript support
* A powerful CLI and awesome community-made plugins

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

## 👶 Basic Usage

#### ` index.js (ESM)`

```js
import { Client, GatewayIntentBits } from 'discord.js';
import { Sern, single } from '@sern/handler';

//client has been declared previously

export const useContainer = Sern.makeDependencies({
    build: root => root
        .add({ '@sern/client': single(() => client)  })
        .upsert({ '@sern/logger': single(() => new DefaultLogging()) })
});

//View docs for all options
Sern.init({
	defaultPrefix: '!', // removing defaultPrefix will shut down text commands
	commands: 'src/commands',
	// events: 'src/events' (optional),
	containerConfig : {
	    get: useContainer
	}
});

client.login("YOUR_BOT_TOKEN_HERE");
```

#### ` ping.js (ESM)`

```js
import { CommandType, commandModule } from '@sern/handler';

exports.default = commandModule({
  type: CommandType.Slash,
  description: 'A ping pong command',
  execute(ctx) {
    ctx.reply('pong!');
  }
});
```

## 🤖 Bots Using sern 
- [Community Bot](https://github.com/sern-handler/sern-community), the community bot for our [discord server](https://sern.dev/discord).
- [Vinci](https://github.com/SrIzan10/vinci), the bot for Mara Turing.
- [Bask](https://github.com/baskbotml/bask), Listen your favorite artists on Discord.
- [ava](https://github.com/SrIzan10/ava), A discord bot that plays KNGI and Gensokyo Radio.
- [ALMA (WIP)](https://github.com/Benzo-Fury/ALMA), Using AI to unleash the power in your server.
- [Protector (WIP)](https://github.com/needhamgary/Protector), Just a simple bot to help enhance a private minecraft server.

## 💻 CLI

It is **highly encouraged** to use the [command line interface](https://github.com/sern-handler/cli) for your project. Don't forget to view it.

## 🔗 Links

- [Official Documentation and Guide](https://sern.dev)
- [Support Server](https://sern.dev/discord)

## 👋 Contribute

- Read our contribution [guidelines](https://github.com/sern-handler/handler/blob/main/.github/CONTRIBUTING.md) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and report bugs
- All kinds of contributions are welcomed.

## Build

- Install pnpm
```sh
npm install -g pnpm
```
- Copy
```sh
git clone https://github.com/sern-handler/handler.git
```
- Create bundle
```sh
pnpm run build
```
