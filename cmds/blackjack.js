import Blackjack from "../utils/Blackjack.js";
import { createButtonsRow, createContainerUI, sendFollowup } from "../utils/helpers.js";

const games = new Map();

const blackjack = {
  name: "blackjack",
  description: "Play a game of Blackjack",
  async run(interaction) {
    const userId = interaction.member.user.id;
    return startNewGame(userId);
  }
};

function startNewGame(userId, isUpdate = false) {
  const game = new Blackjack();
  const { player, dealer } = game.startGame();
  games.set(userId, game);

  const initButtons = [
    { emoji: "👊", customId: `blackjack:hit:${userId}`, style: 1 },
    { emoji: "🛑", customId: `blackjack:stand:${userId}`, style: 2 }
  ]

  if (game.canSplit()) {
    initButtons.push({
      style: 3, // success
      emoji: "➗",
      customId: `blackjack:split:${userId}`
    });
  }
  const buttons = createButtonsRow(initButtons);

  const initContainer = createContainerUI({
    containerItems: [
      {
        type: "displaytext",
        text: `## 🃏 Blackjack 🃏`,
      },
      {
        type: "separator",
        size: 2,
        showDivider: true
      },
      {
        type: "displaytext",
        text: `**Your cards:** \`${game.formatHand(player[game.currentHandIndex])}\` \` ${game.getHandValue(player[game.currentHandIndex])} \``,
      },
      {
        type: "separator",
        showDivider: false
      },
      {
        type: "displaytext",
        text: `**Dealer's card:** \`${game.formatHand(dealer)}\` \` ${game.getHandValue([dealer[0]])} \``
      },
      {
        type: "separator"
      },
      {
        type: 'actionrow',
        row: buttons
      }
    ]
  })
  return {
    type: isUpdate ? 7 : 4,
    data: {
      flags: 32768,
      components: initContainer
    }
  };

}

const buttonHandlers = {
  hit: async (game, userId) => {
    const { hands, gameOver, busted, handIndex } = game.hit();
    const playerCards = hands[game.currentHandIndex]
    const dealerCards = gameOver ?
      game.dealer : [game.dealer[0], { display: "❓" }];

    const playerHandDisplay = game.playerHands.length > 1 ?
      `Hand ${game.currentHandIndex + 1}` : "Your cards"

    const overContainer = createContainerUI({
      containerItems: [
        {
          type: "displaytext",
          text: `❌ Game already ended.`
        }
      ]
    })
    if (!playerCards) {
      return {
        type: 7,
        data: {
          flags: 32768,
          components: [...overContainer]
        }
      };
    }

    if (gameOver) {
      const bustContainer = {
        containerItems: [
          {
            type: "displaytext",
            text: `## 🃏 Blackjack 🃏`,
          },
          {
            type: "separator",
            size: 2,
            showDivider: true
          },
          {
            type: "displaytext",
            text: `**${playerHandDisplay}:** \`${game.formatHand(playerCards)}\` \` ${game.getHandValue(playerCards)} \``
          },
          {
            type: "separator",
            showDivider: false
          },
          {
            type: "displaytext",
            text: `**Dealer's card:** \`${game.formatHand(dealerCards)}\` \` ${game.getHandValue(game.dealer)} \``
          },
          {
            type: "separator",
            size: 2,
            showDivider: true
          },
          {
            type: "displaytext",
            text: `**Result:** ${game.getFinalResults()}`
          },
          {
            type: "actionrow",
            row: createButtonsRow([
              { emoji: "👐", customId: `blackjack:showHands:${userId}`, style: 2 },
              { emoji: "🔁", customId: `blackjack:restart:${userId}`, style: 2 }
            ])
          }
        ]
      }

      games.delete(userId);
      return {
        type: 7,
        data: {
          flags: 32768,
          components: createContainerUI(bustContainer)
        }
      };
    } else {
      const hitButtons = [
        { emoji: "👊", customId: `blackjack:hit:${userId}`, style: 1 },
        { emoji: "🛑", customId: `blackjack:stand:${userId}`, style: 2 }
      ];
      if (game.canSplit()) {
        hitButtons.push({
          style: 3, // success
          emoji: "➗",
          customId: `blackjack:split:${userId}`
        });
      }

      const hitContainer = {
        containerItems: [
          {
            type: "displaytext",
            text: `## 🃏 Blackjack 🃏`,
          },
          {
            type: "separator",
            size: 2,
            showDivider: true
          },
          {
            type: "displaytext",
            text: `**${playerHandDisplay}:** \`${game.formatHand(playerCards)}\` \` ${game.getHandValue(playerCards)} \``
          },
          {
            type: "separator",
            showDivider: false
          },
          {
            type: "displaytext",
            text: `**Dealer's card:** \`${game.formatHand(dealerCards)}\` \` ${game.getHandValue([game.dealer[0]])} \``
          },
          {
            type: "separator"
          },
          {
            type: 'actionrow',
            row: createButtonsRow(hitButtons)
          }
        ]
      }
      if (game.playerHands.length > 1) {
        hitContainer.containerItems.push(
          {
            type: "actionrow",
            row: createButtonsRow([
              { emoji: "👐", customId: `blackjack:showHands:${userId}`, style: 2 },
            ])
          }
        )
      }

      return {
        type: 7,
        data: {
          flags: 32768,
          components: createContainerUI(hitContainer)
        }
      };
    }
  },
  stand: async (game, userId) => {
    const { player, dealer, next, handIndex, result } = game.stand();

    if (next) {
      const nextHand = game.playerHands[game.currentHandIndex];
      const nextHandButtons = [
        { emoji: "👊", customId: `blackjack:hit:${userId}`, style: 1 },
        { emoji: "🛑", customId: `blackjack:stand:${userId}`, style: 2 }
      ]
      if (game.canSplit()) {
        nextHandButtons.push({
          style: 3, // success
          emoji: "➗",
          customId: `blackjack:split:${userId}`
        });
      }

      const nextHandContainer = {
        containerItems: [
          {
            type: "displaytext",
            text: `## 🃏 Blackjack 🃏`,
          },
          {
            type: "separator",
            size: 2,
            showDivider: true
          },
          {
            type: "displaytext",
            text: `**Hand ${game.currentHandIndex + 1}:** \`${game.formatHand(nextHand)}\` \` ${game.getHandValue(nextHand)} \``
          },
          {
            type: "separator",
            showDivider: false
          },
          {
            type: "displaytext",
            text: `**Dealer's card:** \`${game.formatHand(dealer)}\` \` ${game.getHandValue([game.dealer[0]])} \``
          },
          {
            type: "separator"
          },
          {
            type: 'actionrow',
            row: createButtonsRow(nextHandButtons)
          }
        ]
      }
      if (game.playerHands.length > 1) {
        nextHandContainer.containerItems.push(
          {
            type: "actionrow",
            row: createButtonsRow([
              { emoji: "👐", customId: `blackjack:showHands:${userId}`, style: 2 },
            ])
          }
        )
      }

      return {
        type: 7,
        data: {
          flags: 32768,
          components: createContainerUI(nextHandContainer)
        }
      };
    } else {
      games.delete(userId);
      const standContainer = createContainerUI({
        containerItems: [
          {
            type: "displaytext",
            text: `## 🃏 Blackjack 🃏`,
          },
          {
            type: "separator",
            size: 2,
            showDivider: true
          },
          {
            type: "displaytext",
            text: `**Your cards:** \`${game.formatHand(player[game.currentHandIndex])}\` \` ${game.getHandValue(player[game.currentHandIndex])} \``
          },
          {
            type: "separator",
            showDivider: false
          },
          {
            type: "displaytext",
            text: `**Dealer's card:** \`${game.formatHand(dealer)}\` \` ${game.getHandValue(dealer)} \``
          },
          {
            type: "separator",
            size: 2,
            showDivider: true
          },
          {
            type: "displaytext",
            text: `**Result:** ${result}`
          },
          {
            type: "actionrow",
            row: createButtonsRow([
              { emoji: "🔁", customId: `blackjack:restart:${userId}`, style: 2 },
            ])
          }
        ]
      })
      return {
        type: 7,
        data: {
          flags: 32768,
          components: [...standContainer]
        }
      };
    }
  },
  split: async (game, userId) => {
    game.split();
    const playerCards = game.playerHands[game.currentHandIndex]
    const dealerCards = [game.dealer[0], { display: "❓" }];

    const afterSplitButtons = [
      { emoji: "👊", customId: `blackjack:hit:${userId}`, style: 1 },
      { emoji: "🛑", customId: `blackjack:stand:${userId}`, style: 2 }
    ];
    if (game.canSplit()) {
      afterSplitButtons.push({
        style: 3, // success
        emoji: "➗",
        customId: `blackjack:split:${userId}`
      });
    }

    const splitContainer = {
      containerItems: [
        {
          type: "displaytext",
          text: `## 🃏 Blackjack 🃏`,
        },
        {
          type: "separator",
          size: 2,
          showDivider: true
        },
        {
          type: "displaytext",
          text: `**Hand ${game.currentHandIndex + 1}:** \`${game.formatHand(playerCards)}\` \` ${game.getHandValue(playerCards)} \``
        },
        {
          type: "separator",
          showDivider: false
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${game.formatHand(dealerCards)}\` \` ${game.getHandValue([game.dealer[0]])} \``
        },
        {
          type: "separator"
        },
        {
          type: 'actionrow',
          row: createButtonsRow(afterSplitButtons)
        }
      ]
    }
    if (game.playerHands.length > 1) {
      splitContainer.containerItems.push(
        {
          type: "actionrow",
          row: createButtonsRow([
            { emoji: "👐", customId: `blackjack:showHands:${userId}`, style: 2 },
          ])
        }
      )
    }

    return {
      type: 7,
      data: { flags: 32768, components: createContainerUI(splitContainer) }
    };

  },
  showHands: async (game, userId) => {
    const hands = game.finishedHands;
    if (!hands || hands.length === 0) {
      return {
        type: 4,
        data: { flags: 64, content: "No finished hands yet!" } // ephemeral
      };
    }
    
    const displayText = hands.map(h =>
      `**Hand ${h.index + 1}:** ${game.formatHand(h.cards)} → ${game.getHandValue(h.cards)}`
    ).join("\n");

    const finishedHandsContainer = {
      containerItems: [
        {
          type: "displaytext",
          text: `## Finished Hands (${game.finishedHands.length}/${game.playerHands.length}):\n\n${displayText}`
        }
      ]
    }

    return {
      type: 4,
      data: {
        flags: 32768 + 64,
        components: createContainerUI(finishedHandsContainer)
      }
    };
  },

  restart: async (_game, userId) => {
    // start a fresh game
    const response = startNewGame(userId, true);

    // if this was a button click, change type 7 so it updates the existing message
    response.type = 7;

    return response;
  }

};

export default blackjack;
export { games, buttonHandlers };
