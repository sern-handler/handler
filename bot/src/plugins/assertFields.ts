/**
 * This plugin checks the fields of a ModalSubmitInteraction
 * with regex or a custom callback
 *
 * @author @jacoobes [<@182326315813306368>]
 * @version 1.0.0
 * @example
 * ```ts
 * export default commandModule({
 *     type: CommandType.Modal,
 *     plugins: [
 *         assertFields({
 *             fields: {
 *             // check the modal field "mcUsernameInput" with the regex /a+b+c/
 *                 mcUsernameInput: /a+b+c+/
 *             },
 *             failure: (errors, interaction) => {
 *                 interaction.reply(errors.join("\n"))
 *             }
 *         }),
 *     ],
 *     execute: ctx => {
 *         ctx.reply("nice!")
 *     }
 * })
 * ```
 */
import { CommandControlPlugin, CommandType, controller } from "@sern/handler";
import type { ModalSubmitInteraction } from "discord.js";

type Assertion =
    | RegExp
    | ((value : string) => boolean);

export function assertFields(config: {
    fields:  Record<string, Assertion>,
    failure: (errors: string[], interaction: ModalSubmitInteraction) => any
}) {
    return CommandControlPlugin<CommandType.Modal>(modal => {
        const pairs = Object.entries(config.fields);
        const errors = [];
        for(const [ field, assertion ] of pairs) {
            // Keep in mind this doesn't check for typos!
            // feel free to add more checks.
            const input = modal.fields.getTextInputValue(field)
            const resolvedAssertion = assertion instanceof RegExp ? (value: string) => assertion.test(value) : assertion;
            if(!resolvedAssertion(input)) {
                errors.push(input + " failed to pass assertion " + resolvedAssertion.toString() )
            }
        }
        if(errors.length > 0) {
            config.failure(errors, modal);
            return controller.stop();
        }
        return controller.next();
    })
}
