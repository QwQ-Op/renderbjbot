import dotenv from "dotenv";
dotenv.config();
import { ui } from "./uiConstants.js";
import { DB } from "./Database.js";
import { InteractionContext } from "./interactionContext.js";

export class CommandHandler {
    constructor({ commands = {}, buttonHandlers = {}, games = {} } = {}) {
        this.commands = commands;          // { ping: { run() { … } }, … }
        this.buttonHandlers = buttonHandlers; // { blackjack: { hit() {}, stand() {} }, … }
        this.games = games;                // { blackjack: Map(), … }
        this.db = new DB(ui);
    }
    async handle(data) {
     
            const ctx = new InteractionContext(data);

            // ping from Discord
            if (data.type === 1) return { type: 1 };

            // Slash commands
            if (data.type === 2) {
                const command = this.commands[data.data.name];
                if (!command) {
                    return ctx.reply({ flags: 64, content: "❌ Unknown command." });
                }

                return command.run({
                    ctx,
                    ui,
                    db: this.db,
                    interaction: data
                });
            }

            // Buttons / components
            if (data.type === 3) {
                const [cmdName, action, userId] = data.data.custom_id.split(":");
                const handlers = this.buttonHandlers[cmdName];
                const gameMap = this.games[cmdName];
                if (!handlers) {
                    return ctx.reply({ flags: 64, content: "❌ Unknown interaction." });
                }

                const game = gameMap ? gameMap.get(userId) : null;
                if (!game && action !== "restart" && action !== "gameOver_showHands") {
                    return ctx.reply({
                        flags: 64,
                        content: "❌ You have no active game. Start a new one!"
                    });
                }
                if (userId !== ctx.user.id) {
                    console.log(JSON.stringify(data, null, 2))
                    return ctx.reply({
                        flags: 64,
                        content: `This component can only be used by <@${userId}>`
                    })
                }
                const actionHandler = handlers[action];
                if (!actionHandler) {
                    return ctx.reply({ flags: 64, content: "❌ Unknown button action." });
                }

                return actionHandler(game, userId, {
                    ctx,
                    ui,
                    db: this.db,
                    interaction: data
                });
            }

            return null;     
    }
}

  