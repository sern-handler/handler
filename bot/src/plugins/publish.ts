// @ts-nocheck
/**
 * @plugin
 * [DEPRECATED] It allows you to publish your application commands using the discord.js library with ease.
 *
 * @author @EvolutionX-10 [<@697795666373640213>]
 * @version 2.0.0
 * @example
 * ```ts
 * import { publish } from "../plugins/publish";
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [ publish() ], // put an object containing permissions, ids for guild commands, boolean for dmPermission
 *  // plugins: [ publish({ guildIds: ['guildId'], defaultMemberPermissions: 'Administrator'})]
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 * @end
 */
import {
	CommandInitPlugin,
	CommandType,
	controller,
	SernOptionsData,
	SlashCommand,
	Service,
} from "@sern/handler";
import {
	ApplicationCommandData,
	ApplicationCommandType,
	ApplicationCommandOptionType,
	PermissionResolvable,
} from "discord.js";

export const CommandTypeRaw = {
	[CommandType.Both]: ApplicationCommandType.ChatInput,
	[CommandType.CtxUser]: ApplicationCommandType.User,
	[CommandType.CtxMsg]: ApplicationCommandType.Message,
	[CommandType.Slash]: ApplicationCommandType.ChatInput,
} as const;

export function publish<
	T extends
		| CommandType.Both
		| CommandType.Slash
		| CommandType.CtxMsg
		| CommandType.CtxUser,
>(options?: PublishOptions) {
	return CommandInitPlugin<T>(async ({ module }) => {
		// Users need to provide their own useContainer function.
		let client;
		try {
			client = (await import("@sern/handler")).Service("@sern/client");
		} catch {
			const { useContainer } = await import("../index.js");
			client = useContainer("@sern/client")[0];
		}
		const defaultOptions = {
			guildIds: [],
			dmPermission: undefined,
			defaultMemberPermissions: null,
		};

		options = { ...defaultOptions, ...options } as PublishOptions &
			ValidPublishOptions;
		let { defaultMemberPermissions, dmPermission, guildIds } =
			options as unknown as ValidPublishOptions;

		function c(e: unknown) {
			console.error("publish command didnt work for", module.name);
			console.error(e);
		}

		const log =
			(...message: any[]) =>
			() =>
				console.log(...message);
		const logged = (...message: any[]) => log(message);
		/**
		 * a local function that returns either one value or the other,
		 * depending on {t}'s CommandType. If the commandtype of
		 * this module is CommandType.Both or CommandType.Text or CommandType.Slash,
		 * return 'is', else return 'els'
		 * @param t
		 * @returns S | T
		 */
		const appCmd = <V extends CommandType, S, T>(t: V) => {
			return (is: S, els: T) => ((t & CommandType.Both) !== 0 ? is : els);
		};
		const curAppType = CommandTypeRaw[module.type];
		const createCommandData = () => {
			const cmd = appCmd(module.type);
			return {
				name: module.name,
				type: curAppType,
				description: cmd(module.description, ""),
				options: cmd(
					optionsTransformer((module as SlashCommand).options ?? []),
					[],
				),
				defaultMemberPermissions,
				dmPermission,
			} as ApplicationCommandData;
		};

		try {
			const commandData = createCommandData();

			if (!guildIds.length) {
				const cmd = (await client.application!.commands.fetch()).find(
					(c) => c.name === module.name && c.type === curAppType,
				);
				if (cmd) {
					if (!cmd.equals(commandData, true)) {
						logged(
							`Found differences in global command ${module.name}`,
						);
						cmd.edit(commandData).then(
							log(
								`${module.name} updated with new data successfully!`,
							),
						);
					}
					return controller.next();
				}
				client
					.application!.commands.create(commandData)
					.then(log("Command created", module.name))
					.catch(c);
				return controller.next();
			}

			for (const id of guildIds) {
				const guild = await client.guilds.fetch(id).catch(c);
				if (!guild) continue;
				const guildCmd = (await guild.commands.fetch()).find(
					(c) => c.name === module.name && c.type === curAppType,
				);
				if (guildCmd) {
					if (!guildCmd.equals(commandData, true)) {
						logged(`Found differences in command ${module.name}`);
						guildCmd
							.edit(commandData)
							.then(
								log(
									`${module.name} updated with new data successfully!`,
								),
							)
							.catch(c);
						continue;
					}
					continue;
				}
				guild.commands
					.create(commandData)
					.then(log("Guild Command created", module.name, guild.name))
					.catch(c);
			}
			return controller.next();
		} catch (e) {
			logged("Command did not register" + module.name);
			logged(e);
			return controller.stop();
		}
	});
}

export function optionsTransformer(ops: Array<SernOptionsData>) {
	return ops.map((el) => {
		switch (el.type) {
			case ApplicationCommandOptionType.String:
			case ApplicationCommandOptionType.Number:
			case ApplicationCommandOptionType.Integer: {
				return el.autocomplete && "command" in el
					? (({ command, ...el }) => el)(el)
					: el;
			}
			default:
				return el;
		}
	});
}

export type NonEmptyArray<T extends `${number}` = `${number}`> = [T, ...T[]];

export interface ValidPublishOptions {
	guildIds: string[];
	dmPermission: boolean;
	defaultMemberPermissions: PermissionResolvable;
}

interface GuildPublishOptions {
	guildIds?: NonEmptyArray;
	defaultMemberPermissions?: PermissionResolvable;
	dmPermission?: never;
}

interface GlobalPublishOptions {
	defaultMemberPermissions?: PermissionResolvable;
	dmPermission?: false;
	guildIds?: never;
}

type BasePublishOptions = GuildPublishOptions | GlobalPublishOptions;

export type PublishOptions = BasePublishOptions &
	(
		| Required<Pick<BasePublishOptions, "defaultMemberPermissions">>
		| (
				| Required<Pick<BasePublishOptions, "dmPermission">>
				| Required<Pick<BasePublishOptions, "guildIds">>
		  )
	);
