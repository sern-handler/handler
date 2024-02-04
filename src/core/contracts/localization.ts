/**
  * @since 3.4.0
  * Represents a localization service which can translate text for you.
  * The internal representation of localization may differ between Localizers,
  * But we are insured that translate, translateFor, currentLocale are always available
 */
export interface Localization {
    translate(text: string, local: string) : string;
    translationsFor(path: string): Record<string, any>
    currentLocale: string
}
