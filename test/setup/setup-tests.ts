import { vi } from 'vitest'

vi.mock('discord.js', async (importOriginal) => {
    const mod = await importOriginal()
    const ModalSubmitInteraction = class {
        customId;
        type = 5;
        isModalSubmit = vi.fn();
        constructor(customId) {
            this.customId = customId;
        }
    };
    const ButtonInteraction = class {
        customId;
        type = 3;
        componentType = 2;
        isButton = vi.fn();
        constructor(customId) {
            this.customId = customId;
        }
    };
    const AutocompleteInteraction = class {
        type = 4;
        option: string;
        constructor(s: string) {
            this.option = s;
        }
        options = {
            getFocused: vi.fn(),
            getSubcommand: vi.fn(),
        };
    };

    return {
        Client : vi.fn(),
        Collection: mod.Collection,
        ComponentType: mod.ComponentType,
        InteractionType: mod.InteractionType,
        ApplicationCommandOptionType: mod.ApplicationCommandOptionType,
        ApplicationCommandType: mod.ApplicationCommandType, 
        ModalSubmitInteraction,
        ButtonInteraction,
        AutocompleteInteraction,
        ChatInputCommandInteraction: vi.fn()
    };
});
