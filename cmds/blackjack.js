import Blackjack from "../utils/Blackjack.js";
const games = new Map();

export default {
  name: "blackjack",
  description: "Play a game of Blackjack",
  options: [
    {
      name: "bet",
      description: "Amount to bet.",
      type: 3, // INTEGER
      required: false
    },
  ],
  async run({ ctx, ui, db }) {
    const userId = ctx.user.id;
    const bal = await db.pocket.getBal(userId)
    const userBetString = ctx.getOptionValue("bet")

    const bet = ui.amt.handleBet(userBetString, bal)
    if (typeof bet === "string") {
      return ctx.reply({ flags: 64, content: bet });
    }
    return startNewGame(userBetString, bet, db, ui, ctx, userId);
  },

  buttons: {
    hit: async (game, userId, { ctx, ui, db, interaction }) => {
      const { hands, gameOver, busted, handIndex } = game.hit();
      const playerCards = hands[game.currentHandIndex]
      const dealerCards = gameOver ?
        game.dealer : game.dealerInitialCards();

      const playerHandDisplay = game.playerHands.length > 1 ?
        `Hand ${game.currentHandIndex + 1}` : "Your cards"

      const overContainer = ui.comp.createContainerUI({
        containerItems: [
          {
            type: "displaytext",
            text: `❌ Game already ended.`
          }
        ]
      })
      if (!playerCards) {
        return ctx.update({
          flags: 32768,
          components: overContainer
        });
      }

      if (gameOver) {
        const { results, totalBet, totalPayout, netProfit } = game.getFinalResults()
        await db.pocket.addCoins(userId, totalPayout)

        let userBal = await db.pocket.getBal(userId)
        const betForNext = typeof ui.amt.handleBet(game.betString, userBal) === 'string' ?
        game.playerBets[0] : ui.amt.handleBet(game.betString, userBal)

        const bustContainer = {
          containerItems: [
            {
              type: "displaytext",
              text: `## Blackjack `,
              sep: [2]
            },
            {
              type: "displaytext",
              text: `**${playerHandDisplay}:** ${game.formatHand(playerCards)} **\` ${game.getHandValue(playerCards)} \`**`,
              sep: [false]
            },
            {
              type: "displaytext",
              text: `**Dealer's card:** ${game.formatHand(dealerCards)} **\` ${game.getHandValue(dealerCards)} \`**`,
              sep: [2]
            },
            {
              type: "displaytext",
              text: `### **Result:**\n${results}`
            }
          ]
        }

        if (game.playerHands.length > 1) {
          const hands = game.finishedHands;
          const textToEncode = hands.map(h =>
            `${h.resultEmoji} **Hand ${h.index + 1}:** ${game.formatHand(h.cards)} → ${game.getHandValue(h.cards)}`
          ).join("\n");
          const objToEncode = {
            color: game.getOutcomeColor(),
            text: textToEncode,
            totalHands: game.playerHands.length
          }

          bustContainer.containerItems.push(
            {
              type: "section",
              options: {
                textDisplay: [
                  { text: `-# **Pocket**: ${ui.amt.formatBal(userBal)}[${ui.emojis.blank}](${encodeGameResult(objToEncode)})` }
                ],
                accessory: {
                  type: "button",
                  customId: `blackjack:gameOver_showHands:${userId}`,
                  emoji: `${ui.emojis.logs}`,
                  style: 2
                }
              }
            },
            {
              inContainer: false,
              type: "actionrow",
              row: ui.comp.createButtonsRow([
                { label: ` ( ${ui.amt.formatBal(betForNext, false)} )`, emoji: ui.emojis.restart, customId: `blackjack:restart:${userId}:${game.betString}`, style: 2 },
              ])
            }
          )
        } else {
          bustContainer.containerItems.push(
            {
              type: "displaytext",
              text: `-# **Pocket**: ${ui.amt.formatBal(userBal)}`
            },
            {
              inContainer: false,
              type: "actionrow",
              row: ui.comp.createButtonsRow([
                { label: ` ( ${ui.amt.formatBal(betForNext, false)} )`, emoji: ui.emojis.restart, customId: `blackjack:restart:${userId}:${game.betString}`, style: 2 },
              ])
            }
          )
        }

        games.delete(userId);
        return ctx.update({
          flags: 32768,
          components: ui.comp.createContainerUI(bustContainer,
            { color: game.getOutcomeColor() })
        });

      } else {
        const hitButtons = [
          { emoji: ui.emojis.hit, customId: `blackjack:hit:${userId}`, style: 1 },
          { emoji: ui.emojis.stand, customId: `blackjack:stand:${userId}`, style: 2 }
        ];
        if (game.canSplit()) {
          hitButtons.push({
            style: 3, // success
            emoji: ui.emojis.split,
            customId: `blackjack:split:${userId}`
          });
        }

        const hitContainer = {
          containerItems: [
            {
              type: "displaytext",
              text: `## Blackjack `,
              sep: [2]
            },
            {
              type: "displaytext",
              text: `**${playerHandDisplay}:** ${game.formatHand(playerCards)} **\` ${game.getHandValue(playerCards)} \`**`,
              sep: [false]
            },
            {
              type: "displaytext",
              text: `**Dealer's card:** ${game.formatHand(dealerCards)} **\` ${game.getHandValue([game.dealer[0]])} \`**`,
              sep: [2]
            }
          ]
        }
        if (game.playerHands.length > 1) {
          hitContainer.containerItems.push(
            {
              type: "section",
              options: {
                textDisplay: [
                  { text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}` }
                ],
                accessory: {
                  type: "button",
                  customId: `blackjack:showHands:${userId}`,
                  emoji: `${ui.emojis.logs}`,
                  style: 2
                }
              }
            },
            {
              inContainer: false,
              type: 'actionrow',
              row: ui.comp.createButtonsRow(hitButtons)
            }
          )
        } else {
          hitContainer.containerItems.push(
            { type: "displaytext", text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}`, },
            {
              inContainer: false,
              type: 'actionrow',
              row: ui.comp.createButtonsRow(hitButtons)
            }
          )
        }

        return ctx.update({
          flags: 32768,
          components: ui.comp.createContainerUI(hitContainer)
        });

      }
    },
    stand: async (game, userId, { ctx, ui, db }) => {
      const { player, dealer, next, handIndex } = game.stand();
      const dealerCards = game.isGameOver ?
        game.dealer : game.dealerInitialCards();

      if (next) {
        const nextHand = game.playerHands[game.currentHandIndex];
        const nextHandButtons = [
          { emoji: ui.emojis.hit, customId: `blackjack:hit:${userId}`, style: 1 },
          { emoji: ui.emojis.stand, customId: `blackjack:stand:${userId}`, style: 2 }
        ]
        if (game.canSplit()) {
          nextHandButtons.push({
            style: 3, // success
            emoji: ui.emojis.split,
            customId: `blackjack:split:${userId}`
          });
        }

        const nextHandContainer = {
          containerItems: [
            {
              type: "displaytext",
              text: `## Blackjack `,
              sep: [2]
            },
            {
              type: "displaytext",
              text: `**Hand ${game.currentHandIndex + 1}:** ${game.formatHand(nextHand)} **\` ${game.getHandValue(nextHand)} \`**`,
              sep: [false]
            },
            {
              type: "displaytext",
              text: `**Dealer's card:** ${game.formatHand(dealerCards)} **\` ${game.getHandValue([game.dealer[0]])} \`**`,
              sep: [2]
            }
          ]
        }
        if (game.playerHands.length > 1) {
          nextHandContainer.containerItems.push(
            {
              type: "section",
              options: {
                textDisplay: [
                  { text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}` }
                ],
                accessory: {
                  type: "button",
                  customId: `blackjack:showHands:${userId}`,
                  emoji: `${ui.emojis.logs}`,
                  style: 2
                }
              }
            },
            {
              inContainer: false,
              type: 'actionrow',
              row: ui.comp.createButtonsRow(nextHandButtons)
            }
          )
        } else {
          nextHandContainer.containerItems.push(
            { type: "displaytext", text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}`, },
            {
              inContainer: false,
              type: 'actionrow',
              row: ui.comp.createButtonsRow(nextHandButtons)
            })
        }

        return ctx.update({
          flags: 32768,
          components: ui.comp.createContainerUI(nextHandContainer)
        });
      } else {
        const { results, totalBet, totalPayout, netProfit } = game.getFinalResults()
        await db.pocket.addCoins(userId, totalPayout)

        let userBal = await db.pocket.getBal(userId)
        const betForNext = typeof ui.amt.handleBet(game.betString, userBal) === 'string' ?
          game.playerBets[0] : ui.amt.handleBet(game.betString, userBal)

        const display = game.playerHands.length > 1 ?
          `Hand ${game.currentHandIndex + 1}` : "Your cards";
        const standContainer = {
          containerItems: [
            {
              type: "displaytext",
              text: `## Blackjack `,
              sep: [2]
            },
            {
              type: "displaytext",
              text: `**${display}:** ${game.formatHand(player[game.currentHandIndex])} **\` ${game.getHandValue(player[game.currentHandIndex])} \`**`,
              sep: [false]
            },
            {
              type: "displaytext",
              text: `**Dealer's card:** ${game.formatHand(dealerCards)} **\` ${game.getHandValue(dealer)} \`**`,
              sep: [2]
            },
            {
              type: "displaytext",
              text: `### **Result:**\n${results}`
            }
          ]
        }

        if (game.playerHands.length > 1) {
          const hands = game.finishedHands;
          const textToEncode = hands.map(h =>
            `${h.resultEmoji} **Hand ${h.index + 1}:** ${game.formatHand(h.cards)} → ${game.getHandValue(h.cards)}`
          ).join("\n");
          const objToEncode = {
            color: game.getOutcomeColor(),
            text: textToEncode,
            totalHands: game.playerHands.length
          }

          standContainer.containerItems.push(
            {
              type: "section",
              options: {
                textDisplay: [
                  { text: `-# **Pocket**: ${ui.amt.formatBal(userBal)}[${ui.emojis.blank}](${encodeGameResult(objToEncode)})` }
                ],
                accessory: {
                  type: "button",
                  customId: `blackjack:gameOver_showHands:${userId}`,
                  emoji: `${ui.emojis.logs}`,
                  style: 2
                }
              }
            },
            {
              inContainer: false,
              type: "actionrow",
              row: ui.comp.createButtonsRow([
                { label: ` ( ${ui.amt.formatBal(betForNext, false)} )`, emoji: ui.emojis.restart, customId: `blackjack:restart:${userId}:${game.betString}`, style: 2 },
              ])
            }
          )
        } else {
          standContainer.containerItems.push(
            {
              type: "displaytext",
              text: `-# **Pocket**: ${ui.amt.formatBal(userBal)}`
            },
            {

              inContainer: false,
              type: "actionrow",
              row: ui.comp.createButtonsRow([
                { label: ` ( ${ui.amt.formatBal(betForNext, false)} )`, emoji: ui.emojis.restart, customId: `blackjack:restart:${userId}:${game.betString}`, style: 2 },
              ])
            }
          )
        }
        games.delete(userId);
        return ctx.update({
          flags: 32768,
          components: ui.comp.createContainerUI(standContainer,
            { color: game.getOutcomeColor() })
        });

      }
    },
    split: async (game, userId, { ctx, ui, db }) => {
      let userBal = await db.pocket.getBal(userId)
      if (userBal < game.playerBets[0]) {
        return ctx.reply({
          flags: 64, content: `You don't have enough balance.\nPocket: ${ui.amt.formatBal(userBal)}`
        })
      }
      game.split();
      await db.pocket.subCoins(userId, game.playerBets[0])
      const playerCards = game.playerHands[game.currentHandIndex]
      const dealerCards = game.dealerInitialCards();

      const afterSplitButtons = [
        { emoji: ui.emojis.hit, customId: `blackjack:hit:${userId}`, style: 1 },
        { emoji: ui.emojis.stand, customId: `blackjack:stand:${userId}`, style: 2 }
      ];
      if (game.canSplit()) {
        afterSplitButtons.push({
          style: 3, // success
          emoji: ui.emojis.split,
          customId: `blackjack:split:${userId}`
        });
      }

      const splitContainer = {
        containerItems: [
          {
            type: "displaytext",
            text: `### Blackjack \n-# You can click ${ui.emojis.logs} to check your finished hands!`,
            sep: [2]
          },
          {
            type: "displaytext",
            text: `**Hand ${game.currentHandIndex + 1}:** ${game.formatHand(playerCards)} **\` ${game.getHandValue(playerCards)} \`**`,
            sep: [false]
          },
          {
            type: "displaytext",
            text: `**Dealer's card:** ${game.formatHand(dealerCards)} **\` ${game.getHandValue([game.dealer[0]])} \`**`,
            sep: [2]
          }
        ]
      }
      if (game.playerHands.length > 1) {
        splitContainer.containerItems.push(
          {
            type: "section",
            options: {
              textDisplay: [
                { text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}` }
              ],
              accessory: {
                type: "button",
                customId: `blackjack:showHands:${userId}`,
                emoji: `${ui.emojis.logs}`,
                style: 2
              }
            }
          },
          {
            inContainer: false,
            type: 'actionrow',
            row: ui.comp.createButtonsRow(afterSplitButtons)
          }
        )
      } else {
        splitContainer.containerItems.push(
          { type: "displaytext", text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}`, },
          {
            inContainer: false,
            type: 'actionrow',
            row: ui.comp.createButtonsRow(afterSplitButtons)
          }
        )
      }
      return ctx.update({
        flags: 32768,
        components: ui.comp.createContainerUI(splitContainer)
      });
    },
    showHands: async (game, userId, { ctx, ui }) => {
      const hands = game.finishedHands;
      if (!hands || hands.length === 0) {
        return ctx.reply({ flags: 64, content: "No hands finished yet!" });
      }

      const displayText = hands.map(h =>
        `${h.resultEmoji} **Hand ${h.index + 1}:** ${game.formatHand(h.cards)} → ${game.getHandValue(h.cards)}`
      ).join("\n");

      const finishedHandsContainer = {
        containerItems: [
          {
            type: "displaytext",
            text: `## Finished Hands (${game.finishedHands.length}/${game.playerHands.length}):\n\n${displayText}`
          }
        ]
      }

      return ctx.reply({
        flags: 32768 + 64,
        components: ui.comp.createContainerUI(finishedHandsContainer,
          { color: game.isGameOver ? game.getOutcomeColor() : null })
      });
    },
    gameOver_showHands: async (game, userId, { ctx, ui }) => {
      const components = ctx.msg.components
      const allContent = components.flatMap(c => c.components ?? [])
        .filter(comp => comp.accessory).flatMap(x => x.components ?? [])
        .map(y => y.content);
      const regex = /\(https:\/\/gameData\/([^)]+)\)/;
      let encoded;

      for (const content of allContent) {
        const match = content.match(regex);
        if (match) {
          encoded = match[1];
          break;
        }
      }
      let decodedObj;
      if (encoded) {
        decodedObj = decodeGameResult(encoded);
      }

      const finishedHandsContainer = {
        containerItems: [
          {
            type: "displaytext",
            text: `## Finished Hands (${decodedObj.totalHands}/${decodedObj.totalHands}) :\n\n${decodedObj.text}`
          }
        ]
      }

      return ctx.reply({
        flags: 32768 + 64,
        components: ui.comp.createContainerUI(finishedHandsContainer,
          { color: decodedObj.color })
      });
    },

    restart: async (_game, userId, { ctx, ui, db }) => {
      const userBetString = ctx.data.data.custom_id.split(":")[3]
      const userBal = await db.pocket.getBal(userId)
      const bet = ui.amt.handleBet(userBetString, userBal)
      if (typeof bet === "string") {
        return ctx.reply({ flags: 64, content: bet });
      }
      const restartGame = await startNewGame(userBetString, bet, db, ui, ctx, userId, true);
      return restartGame;
    }
  },
  gameMap: games
};

async function startNewGame(userBetString, bet, db, ui, ctx, userId, isUpdate = false) {
  const game = new Blackjack(userBetString, ui, bet);
  await db.pocket.subCoins(userId, bet)

  const { player, dealer } = game.startGame();

  if (games.has(userId)) {
    games.delete(userId); // clear old game first
  }
  games.set(userId, game);

  const initButtons = [
    { emoji: ui.emojis.hit, customId: `blackjack:hit:${userId}`, style: 1 },
    { emoji: ui.emojis.stand, customId: `blackjack:stand:${userId}`, style: 2 }
  ]

  if (game.canSplit()) {
    initButtons.push({
      style: 3, // success
      emoji: ui.emojis.split,
      customId: `blackjack:split:${userId}`
    });
  }

  const initContainer = ui.comp.createContainerUI({
    containerItems: [
      {
        type: "displaytext",
        text: `## Blackjack `,
        sep: [2, true]
      },
      {
        type: "displaytext",
        text: `**Your cards:** ${game.formatHand(player[game.currentHandIndex])} **\` ${game.getHandValue(player[game.currentHandIndex])} \`**`,
        sep: [1, false]
      },
      {
        type: "displaytext",
        text: `**Dealer's card:** ${game.formatHand(dealer)} **\` ${game.getHandValue([dealer[0]])} \`**`,
        sep: [2, true]
      },
      {
        type: "displaytext",
        text: `-# **Bet**: ${ui.amt.formatBal(game.playerBets[game.currentHandIndex])}`,
      },
      {
        inContainer: false,
        type: 'actionrow',
        row: ui.comp.createButtonsRow(initButtons)
      }
    ]
  })
  const payload = {
    flags: 32768,
    components: initContainer
  };

  if (isUpdate) {
    return ctx.update(payload);
  } else {
    return ctx.reply(payload);
  }

}
function encodeGameResult(obj) {
  const json = JSON.stringify(obj);
  const data = Buffer.from(json, "utf8").toString("base64");
  return `https://gameData/${data}`
}

function decodeGameResult(encoded) {
  const json = Buffer.from(encoded, "base64").toString("utf8");
  return JSON.parse(json);
}
