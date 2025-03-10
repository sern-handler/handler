//@ts-nocheck
/**
 * @plugin
 * fromCallback turns a callback into a plugin result.
 * if the callback returns truthy value, plugin continues.
 * This control plugin works for every command type. The arguments of the callback
 * mirror the execute method on the current module.
 * @author @jacoobes [<@182326315813306368>]
 * @version 1.0.0
 * @example
 * ```ts
 * const myServer = "941002690211766332";
 * export default commandModule({
 *     type: CommandType.Both,
 *     plugins: [
 *         fromCallback((ctx, args) => ctx.guildId == myServer)
 *     ],
 *     execute: ctx => {
 *         ctx.reply("I only respond in myServer!");
 *     }
 * })
 * ```
 * @end
 */


import { PluginType, makePlugin, controller } from "@sern/handler";

export const fromCallback = (cb: (...args: any[]) => boolean) => 
    makePlugin(PluginType.Control, (...args) => {
        console.log(args)
        if(cb.apply(null, args)) {
            return controller.next();
        }
        return controller.stop();
    });
