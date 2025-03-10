import { PluginType, makePlugin, controller, ControlPlugin } from "@sern/handler";
import type { AutocompleteInteraction } from 'discord.js'

/** 
 * @plugin
 * filters autocomplete interaction that pass the criteria
 * @author @jacoobes [<@182326315813306368>]
 * @version 1.0.0
 * @example
 * ```ts
 * import { CommandType, commandModule } from "@sern/handler";
 * import { filterA } from '../plugins/filterA.js'
 * export default commandModule({
 *    type : CommandType.Slash,
 *    options: [
 *       {  
 *          autocomplete: true,
 *          command : {
 *             //only accept autocomplete interactions that include 'poo' in the text
 *             onEvent: [filterA(s => s.includes('poo'))],
 *             execute: (autocomplete) => {
 *                let data = [{ name: 'pooba', value: 'first' }, { name: 'pooga', value: 'second' }]
 *                autocomplete.respond(data) 
 *             }
 *          }
 *       }
 *    ],
 *    execute: (ctx, args) => {}
 * })
 * @end
 */

export const filterA = (pred: (value: string) => boolean) => {
    return makePlugin(PluginType.Control, (a: AutocompleteInteraction) => {
        if(pred(a.options.getFocused())) {
            return controller.next();
        }
        return controller.stop();
    }) as ControlPlugin;
}
