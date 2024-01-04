const { Localization } = require('shrimple-locales');

//ok so plan is, 
/**
 * 
 * await makeDependencies(({ include })=> {
 *      include('@sern/localizer') // preconfigure localizer, will expose the translate function
 * });
 * 
 */
const loc = new Localization({
    defaultLocale: 'en',
    fallbackLocale: 'en',
    locales: {
        en: { somethingInside: { hey: 'hi' }, somethingOutside: 'hello' },
        es: { somethingInside: { hey: 'hola inside' }, somethingOutside: 'hola' }
    }
});

console.log(loc.get('somethingOutside'));