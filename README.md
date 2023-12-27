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
- For you. A framework that's tailored to your exact needs.
- Lightweight. Does a lot while being small.
- Latest features. Support for discord.js v14 and all of its interactions.
- Start quickly. Plug and play or customize to your liking.
- works with [bun](https://bun.sh/) and [node](https://nodejs.org/en) out the box!
- Use it with TypeScript or JavaScript. CommonJS and ESM supported.
- Active and growing community, always here to help. [Join us](https://sern.dev/discord)
- Unleash its full potential with a powerful CLI and awesome plugins.

## 📜 Installation
[Start here!!](https://sern.dev/docs/guide/walkthrough/new-project)

## 👶 Basic Usage
<details><summary>ping.ts</summary>

```ts
export default commandModule({
  type: CommandType.Slash,
  //Installed plugin to publish to discord api and allow access to owners only.
  plugins: [publish(), ownerOnly()],
  description: 'A ping pong command',
  execute(ctx) {
    ctx.reply('Hello owner of the bot');
  }
});
```
</details>
<details><summary>modal.ts</summary>

```ts
export default commandModule({
    type: CommandType.Modal,
    //Installed a plugin to make sure modal fields pass a validation.
    plugins : [
        assertFields({
            fields: { 
                name: /^([^0-9]*)$/ 
            },
            failure: (errors, modal) => modal.reply('your submission did not pass the validations')
        })
    ],
    execute : (modal) => {
        modal.reply('thanks for the submission!');
    }
})
```
</details>


## 🤖 Bots Using sern 
- [Community Bot](https://github.com/sern-handler/sern-community), the community bot for our [discord server](https://sern.dev/discord).
- [Vinci](https://github.com/SrIzan10/vinci), the bot for Mara Turing.
- [Bask](https://github.com/baskbotml/bask), Listen your favorite artists on Discord.
- [ava](https://github.com/SrIzan10/ava), A discord bot that plays KNGI and Gensokyo Radio.
- [Murayama](https://github.com/murayamabot/murayama), :pepega:
- [Protector (WIP)](https://github.com/needhamgary/Protector), Just a simple bot to help enhance a private minecraft server.
- [SmokinWeed 💨](https://github.com/Peter-MJ-Parker/sern-bud), A fun bot for a small - but growing - server.

## 💻 CLI

It is **highly encouraged** to use the [command line interface](https://github.com/sern-handler/cli) for your project. Don't forget to view it.

## 🔗 Links

- [Official Documentation and Guide](https://sern.dev)
- [Support Server](https://sern.dev/discord)

## 👋 Contribute
- Read our contribution [guidelines](https://github.com/sern-handler/handler/blob/main/.github/CONTRIBUTING.md) carefully
- Pull up on [issues](https://github.com/sern-handler/handler/issues) and report bugs
- All kinds of contributions are welcomed.

