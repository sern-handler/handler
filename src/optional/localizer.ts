import type { Localizer, Init } from '../core/contracts'
import { Localization } from 'shrimple-locales'
import fs from 'node:fs/promises'
import { join, resolve } from 'node:path';
import { filename } from '../core/module-loading'
/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class ShrimpleLocalizer implements Localizer, Init {
    private __localization!: Localization;
    constructor(){}
    translate(text: string): string {
        return this.__localization.get(text);
    }

    async init() {
        this.__localization = new Localization({
            defaultLocale: "en",
            fallbackLocale: "en",
            locales: await this.readLocalizationDirectory()
        });
    }

    private async readLocalizationDirectory() {
        const translationFiles = [];
        const localPath = resolve('locals');
        for(const json of await fs.readdir(localPath)) {
           translationFiles.push({ [filename(json)]: 
                                   JSON.parse(await fs.readFile(join(localPath, json), 'utf8')) })
        }
        return translationFiles.reduce((acc, cur ) => ({ ...cur, ...acc }),  {});
    }
}
