import type { SernOptionsData } from '../structures/module';
import type { ApplicationCommandOptionData } from 'discord.js';

class OptionsBuilder {
    public constructor(private options: ApplicationCommandOptionData[] = []) {
        this.options = options;
    }
}
