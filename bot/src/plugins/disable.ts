// @ts-nocheck
/**
 * Disables a command entirely, for whatever reasons you may need.
 *
 * @author @jacoobes [<@182326315813306368>]
 * @version 1.0.0
 * @example
 * ```ts
 * import { disable } from "../plugins/disable";
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [ disable() ],
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 */
import { CommandType, EventPlugin, PluginType } from "@sern/handler";
import { InteractionReplyOptions, ReplyMessageOptions } from "discord.js";

export function disable(
	onFail?:
		| string
		| Omit<InteractionReplyOptions, "fetchReply">
		| ReplyMessageOptions
): EventPlugin<CommandType.Both> {
	return {
		type: PluginType.Event,
		description: "Disables command from responding",
		async execute([ctx], controller) {
			if (onFail !== undefined) {
				await ctx.reply(onFail);
			}
			return controller.stop();
		},
	};
}
