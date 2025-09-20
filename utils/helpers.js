import dotenv from "dotenv";
dotenv.config();
const c = `<:chip:1418218497779040327>`;
export function createContainerUI(
    { containerItems = [] },
    options = {}
) {
    const { color = null, useContainer = true, freshContainer = false } = options;
    const built = [];

    const parseSep = (sep) => {
        let size = 1;      // default
        let divider = true; // default

        if (sep === true || Array.isArray(sep) && sep.length === 0) {
            return { size, divider };
        }

        if (Array.isArray(sep)) {
            for (const val of sep) {
                if (typeof val === "number") {
                    size = val;
                } else if (typeof val === "boolean") {
                    divider = val;
                }
            }
        }

        return { size, divider };
    }

    for (const item of containerItems) {
        const inContainer = item.inContainer ?? useContainer;
        const newContainer = item.inNewCont ?? freshContainer;
        const contColor = item.contColor ?? color;
        const pushToBuilt = (comp) => {
            if (newContainer) {
                const formNewCont = {
                    type: 17,
                    components: [comp]
                };
                if (contColor != null) {
                    formNewCont.accent_color = contColor;
                }
                built.push(formNewCont);
            } else if (!inContainer) {
                built.push(comp)
            } else if (built.length > 0 && built[built.length - 1].type === 17 && !newContainer) {
                built[built.length - 1].components.push(comp);
            } else if (inContainer) {
                const formInitCont = {
                    type: 17,
                    components: [comp]
                }
                if (contColor != null) {
                    formInitCont.accent_color = contColor;
                }
                built.push(formInitCont);
            }
        };
        if (item.type.toLowerCase() === 'section') {
            const { textDisplay = [], accessory } = item.options;

            const sections = {
                type: 9,
                components: []
            };

            for (const things of textDisplay) {
                sections.components.push({
                    type: 10, // textDisplay
                    content: things.text
                });
            }

            if (accessory) {
                if (accessory.type.toLowerCase() === 'button') {
                    const btn = {
                        type: 2, // Button
                        custom_id: accessory.customId,
                        style: accessory.style ?? 1, // Default Primary
                    };
                    if (accessory.label) btn.label = accessory.label;
                    if (accessory.emoji) {
                        btn.emoji = typeof accessory.emoji === "string"
                            ? parseEmoji(accessory.emoji)
                            : accessory.emoji;
                    }

                    sections.accessory = btn;
                } else if (accessory.type.toLowerCase() === 'thumbnail') {
                    sections.accessory = {
                        type: 11, // Thumbnail
                        media: {
                            url: accessory.url
                        }
                    };
                }
            } else {
                // Fallback: always include a blank thumbnail
                sections.accessory = {
                    type: 11,
                    media: {
                        url: "https://cdn.discordapp.com/emojis/1400328762310004746.png"
                    }
                };
            }

            pushToBuilt(sections);
        }
        else if (item.type.toLowerCase() === 'actionrow') {
            pushToBuilt(item.row);
        }
        else if (item.type.toLowerCase() === 'separator') {
            const spacing = item.size ?? 1; //1 for small padding, 2 for large padding
            const separation = {
                type: 14,
                divider: item.showDivider ?? true,
                spacing: spacing
            }
            pushToBuilt(separation);
        }
        else if (item.type.toLowerCase() === 'displaytext') {
            const textComponent = {
                type: 10, //textDisplay
                content: item.text
            }
            pushToBuilt(textComponent);
        }
        else if (item.type.toLowerCase() === 'media') {
            const mediaGallery = {
                type: 12, //Media Gallery
                items: []
            }
            for (const things of item.media) {
                mediaGallery.items.push({
                    media: {
                        url: things.url
                    },
                    description: things.desc ?? `\u2800`
                })
            }
            pushToBuilt(mediaGallery);
        }
        if (item.sep) {
            const { size, divider } = parseSep(item.sep);
            pushToBuilt({
                type: 14,
                divider,
                spacing: size
            });
        }
    }
    return built;
}

/**
 * Create a single ActionRow with up to 5 buttons.
 * 
 * @param {Array} buttonsConfig - Array of button config objects.
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
export function createButtonsRow(buttonsConfig = []) {
    if (!Array.isArray(buttonsConfig)) throw new Error('buttonsConfig must be an array');
    if (buttonsConfig.length === 0 || buttonsConfig.length > 5) {
        throw new Error('You must provide between 1 and 5 button configurations.');
    }
    const actionRow = {
        type: 1, //ActionRow
        components: []
    }
    for (const item of buttonsConfig) {
        const btn = {
            type: 2, //button
            custom_id: item.customId,
            style: item.style ?? 2,
            disabled: item.disabled ?? false
        }
        if (item.label) btn.label = item.label;

        if (item.emoji) {
            btn.emoji = typeof item.emoji === "string"
                ? parseEmoji(item.emoji)
                : item.emoji;
        }

        if (item.url && item.style === 5) btn.url = item.url;
        actionRow.components.push(btn)
    }
    return actionRow;
}

/**
 * Create a reusable String Select Menu
 * @param {Object} config - Configuration object
 * @param {string} config.customId - Custom ID for the select menu
 * @param {string} [config.placeholder] - Placeholder text
 * @param {boolean} [config.disabled=false] - Whether the menu is disabled
 * @param {number} [config.minValues=1] - Minimum number of selections
 * @param {number} [config.maxValues=1] - Maximum number of selections
 * @param {Array<Object>} config.options - Array of menu options
 * Each option should be: { label, value, description?, emoji?, default? }
 * @returns {ActionRowBuilder}
 */
export function createStringSelectMenu({
    customId,
    placeholder,
    disabled = false,
    min = 1,
    max = 1,
    options = []
}) {
    if (!customId || !Array.isArray(options) || options.length === 0) {
        throw new Error('Invalid parameters for createStringSelectMenu');
    }
    const selectionMenu = {
        type: 3, //selectMenu
        custom_id: customId,
        min_values: min,
        max_values: max,
        disabled: disabled,
    }
    if (placeholder) selectionMenu.placeholder = placeholder;
    const optionsArr = [];
    for (const opt of options) {
        const createOptions = {
            label: opt.label,
            value: opt.value,
            default: opt.default ?? false,
        }
        if (opt.desc) createOptions.description = opt.desc;
        if (opt.emoji) {
            createOptions.emoji = opt.emoji;
            //createOptions.emoji.name = opt.emoji.name
        }
        optionsArr.push(createOptions)
    }
    selectionMenu.options = optionsArr;
    const actionRow = {
        type: 1, //ActionRow
        components: [selectionMenu]
    }
    // console.log(JSON.stringify(actionRow, null, 2))
    return actionRow;
}

export function createModal(options = {}, { modalItems = [] }) {
    const { title, customId } = options;
    const modal =
    {
        title: title,
        custom_id: customId,
        components: []
    }
    for (const item of modalItems) {
        const compo = {
            type: 1,
            components: [
                {
                    type: 4,
                    custom_id: item.customId,
                    label: item.label,
                    style: item.style ?? 1,
                    min_length: item.min ?? 1,
                    max_length: item.max ?? 4000,
                    required: item.reqd ?? true
                }
            ]
        }
        if (item.placeholder) compo.placeholder = item.placeholder
        if (item.value) compo.value = item.value;
        modal.components.push(compo)
    }
    return modal;
}

function parseEmoji(emoji) {
    const match = emoji.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);
    if (!match) {
        return { name: emoji, id: null };
    }
    return {
        id: match[2],  
        name: match[1],
        animated: emoji.startsWith("<a:")
    };
}


export function handleBet(betInput, userBalance, maxBet = null) {
    if (!betInput || typeof betInput !== 'string' || betInput.trim() === '') {
        return 0;
    }


    betInput = betInput.replace(/,/g, '').trim();
    if (betInput === '') {
        return 'Invalid bet input.';
    }
    betInput = betInput.toLowerCase();

    const maxPossibleBet = maxBet ? Math.min(maxBet, userBalance) : userBalance;

    let amount = null; // <-- unify everything here

    // Handle special cases
    if (betInput === 'all' || betInput === 'max' || betInput === 'max' || betInput === 'm') {
        amount = Math.floor(maxPossibleBet);
    } else if (betInput === 'half' || betInput === 'h') {
        amount = Math.floor(maxPossibleBet / 2);
    } else if (betInput === 'quarter' || betInput === 'q' || betInput === 'qtr') {
        amount = Math.floor(maxPossibleBet / 4);
    }

    // Handle suffixes like k, m, b, t
    if (amount === null) {
        const betMatch = betInput.match(/^(\d+(?:\.\d+)?)([kmbt]?)$/);
        if (betMatch) {
            let [, num, suffix] = betMatch;
            amount = parseFloat(num);
            switch (suffix) {
                case 'k': amount *= 1_000; break;
                case 'm': amount *= 1_000_000; break;
                case 'b': amount *= 1_000_000_000; break;
                case 't': amount *= 1_000_000_000_000; break;
            }
        }
    }

    // Handle scientific notation
    if (amount === null) {
        const sci = betInput.match(/^(\d+(\.\d+)?e[\+\-]?\d+)$/);
        if (sci) {
            amount = parseFloat(betInput);
        }
    }

    // Handle plain numbers
    if (amount === null && !isNaN(betInput)) {
        amount = parseFloat(betInput);
    }

    // === VALIDATION PHASE ===
    if (!Number.isFinite(amount) || amount < 0) {
        return 'Invalid bet input. Please enter a valid number.\n-# Examples: "100", "500k", "1m", "all", "half/h", "quarter/q/qtr" or "1e3".';
    }

    if (amount > userBalance) {
        return `You don't have enough balance to place this bet!\nYour balance: ${formatBal(userBalance)}.`;
    }

    if (maxBet && amount > maxBet) {
        return `Your bet exceeds the max possible bet (${formatBal(maxBet)}).`;
    }

    return Math.floor(amount);
}

export function formatBal(number, emote = true) {
    const num = Number(number)

    if (!emote) {
        return `⚛ ` + num.toLocaleString('en-US')
    } else {
        return num.toLocaleString('en-US') + ` [${c}](https://emoji-grabber-go-away.vercel.app)`
    }
}