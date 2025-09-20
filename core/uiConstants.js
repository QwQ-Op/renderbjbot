
import {
    createButtonsRow,
    createContainerUI,
    createModal,
    createStringSelectMenu,

    handleBet,
    formatBal
} from "../utils/helpers.js"

const colors = {
    green: 5025616,
    red: 15022389,
    yellow: 16763904,
    grey: 6381923
}

const emojis = {
    chip: "<:chip:1418218497779040327>",
    blank: "<:ES_blnk:1400328762310004746>",
    ok: "✅",
    no: "❎",
    warning: "⚠️",
    hit: "<:card_add:1418838209848410214>",
    stand: "<:card_stop:1418839239663292460>",
    split: "<:cards_split:1418838947966222400>",
    restart: "<:arrow_counterclockwise:1418838424193859644>",
    d_Down: "<:cards_skull:1418839997020110949>",
    logs: "<:notepad:1418840546696368180>"
}

// main export
export const ui = {
    colors,
    emojis,
    comp: {
        createButtonsRow,
        createContainerUI,
        createModal,
        createStringSelectMenu
    },
    amt: {
        handleBet,
        formatBal
    }
};
