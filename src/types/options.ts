import type {
    ApplicationCommandAutocompleteOption,
    ApplicationCommandChannelOptionData,
    ApplicationCommandChoicesOption,
    ApplicationCommandNonOptionsData,
    ApplicationCommandNumericOptionData,
    ApplicationCommandSubCommandData,
    ApplicationCommandSubGroupData
} from 'discord.js';

// TODO : make required property optional
type BaseOption = { name : string, description : string, required : false  };

export interface OptionData {
    SUB_COMMAND: ApplicationCommandSubCommandData
    SUB_COMMAND_GROUP: ApplicationCommandSubGroupData
    NONE: ApplicationCommandNonOptionsData
    CHANNEL: ApplicationCommandChannelOptionData
    CHOICE: ApplicationCommandChoicesOption
    AUTO: ApplicationCommandAutocompleteOption
    NUMBER: ApplicationCommandNumericOptionData
    INTEGER: ApplicationCommandNumericOptionData
    USER : { type: 'USER' } & BaseOption
    MENTIONABLE: { type : 'MENTIONABLE' } & BaseOption
    ROLE : { type: 'ROLE' } & BaseOption
    BOOLEAN : { type: 'BOOLEAN' } & BaseOption
}