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

```js
	import { Sern, PayloadOptions } from 'sern-handler';

	const payload = new PayloadOptions({
		commands: '/commands', // Folder where all commands are located (subfolders supported).
		events: '/events' // Events folder directory (subfolders supported).         
		owners: ['182326315813306369'], // Array of Discord ID(s).
		prefix: '/', // Prefix for your bot (if no provied then it will use /).
		client // The instance of Discord#Client().
	});                              

	const handler = new Sern(payload); // Create a new instance of Sern with payloads.
```

# Links

- 📑 [Official Documentation](https://sernhandler.js.org)
- 🎧 [Discord Server](https://discord.gg/QWQWQWQ)

# Contribute
- Pull up on issues and tell me if there are bugs.
- Check issues.
- Any contributions are open to suggestion!
