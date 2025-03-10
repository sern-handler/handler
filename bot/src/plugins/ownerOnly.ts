// @ts-nocheck
/**
 * This is OwnerOnly plugin, it allows only bot owners to run the command, like eval.
 *
 * @author @EvolutionX-10 [<@697795666373640213>]
 * @version 1.2.0
 * @example
 * ```ts
 * import { ownerOnly } from "../plugins/ownerOnly";
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [ ownerOnly() ], // can also pass array of IDs to override default owner IDs
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 */

import { CommandType, CommandControlPlugin, controller } from "@sern/handler";
const ownerIDs = ["182326315813306368"]; //! Fill your ID
export function ownerOnly(override?: string[]) {
	return CommandControlPlugin<CommandType.Both>((ctx) => {
		if ((override ?? ownerIDs).includes(ctx.user.id))
			return controller.next();
		//* If you want to reply when the command fails due to user not being owner, you can use following
		// await ctx.reply("Only owner can run it!!!");
		return controller.stop(); //! Important: It stops the execution of command!
	});
}
