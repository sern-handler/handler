import type { Client } from 'discord.js';

type ProvidesClient = { provides : <T extends Client>(client: T) => void }
