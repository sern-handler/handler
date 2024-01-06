import { Localizer, Init } from '../../contracts'
import { Localization } from 'shrimple-locales'
/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class ShrimpleLocalizer implements Localizer, Init {

    __localization!: Localization;
    translate(text: string): string {
        return this.__localization.get(text);
    }

    async init() {
        //TODO
        this.__localization = new Localization({ } as any);
    }
    
}
