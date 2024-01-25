import type { Localizer, Init } from '../core/contracts'
import { Localization } from 'shrimple-locales'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path';
import { filename } from '../core/module-loading'
import assert from 'node:assert';

/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class ShrimpleLocalizer implements Localizer, Init {
    private __localization!: Localization;
    private __localization_map!: Record<string, any>
    constructor(){}

    translate(text: string, local: string): string {
        this.__localization.changeLanguage(local);
        return this.__localization.get(text);
    }

    async init() {
        const map = await this.readLocalizationDirectory();
        this.__localization = new Localization({
            defaultLocale: "en",
            fallbackLocale: "en",
            locales: map
        });
        this.__localization_map = map
    }

    private async readLocalizationDirectory() {
        const translationFiles = [];
        const localPath = resolve('locals');
        assert(existsSync(localPath), "You need to create a directory called \"locals\" for the localizer")
        for(const json of await fs.readdir(localPath)) {
           translationFiles.push({ [filename(json)]: 
                                   JSON.parse(await fs.readFile(join(localPath, json), 'utf8')) })
        }
        return translationFiles.reduce((acc, cur ) => ({ ...cur, ...acc }),  {});
    }
}
