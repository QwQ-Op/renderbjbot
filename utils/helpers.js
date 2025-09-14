import dotenv from "dotenv";
dotenv.config();

export function createContainerUI(
    { containerItems = [] },
    options = {}
) {
    const { color = null, useContainer = true, freshContainer = false } = options;
    const built = [];

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
                    if (accessory.emoji) btn.emoji = accessory.emoji;
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
        else if (item.type.toLowerCase() === `displaytext`) {
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
                ? { name: item.emoji, id: null }
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


