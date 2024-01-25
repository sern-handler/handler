
export interface Localizer {
    translate(text: string, local: string) : string;
    // translationsFor(path: string): Record<string, any> 
}
