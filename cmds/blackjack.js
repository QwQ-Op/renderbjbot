import Blackjack from "../utils/Blackjack.js";
import { createButtonsRow, createContainerUI } from "../utils/helpers.js";

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

  const buttons = createButtonsRow([
    { label: "Hit", customId: `blackjack:hit:${userId}`, style: 1 },
    { label: "Stand", customId: `blackjack:stand:${userId}`, style: 2 }
  ]);

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
        text: `**Your cards:** \`${player.map(c => c.display).join(" ")}\` \` ${game.getHandValue(player)} \``,
      },
      {
        type: "separator",
        showDivider: false
      },
      {
        type: "displaytext",
        text: `**Dealer's card:** \`${dealer.map(c => c.display).join(" ")}\` \` ${game.getHandValue([dealer[0]])} \``
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
      components: [...initContainer]
    }
  };

}

const buttonHandlers = {
  hit: async (game, userId) => {
    const playerCards = game.hit();
    const dealerCards = game.isGameOver ? game.dealer : [game.dealer[0], { display: "❓" }];
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

    const buttons = createButtonsRow([
      { label: "Hit", customId: `blackjack:hit:${userId}`, style: 1 },
      { label: "Stand", customId: `blackjack:stand:${userId}`, style: 2 }
    ]);

    const hitContainer = createContainerUI({
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
          text: `**Your cards:** \`${playerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue(game.player)} \``
        },
        {
          type: "separator",
          showDivider: false
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue([game.dealer[0]])} \``
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

    const bustContainer = createContainerUI({
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
          text: `**Your cards:** \`${playerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue(game.player)} \``
        },
        {
          type: "separator",
          showDivider: false
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue(game.dealer)} \``
        },
        {
          type: "separator",
          size: 2,
          showDivider: true
        },
        {
          type: "displaytext",
          text: `**Result:** ${game.getResult()}`
        },
        {
          type: "actionrow",
          row: createButtonsRow([
            { emoji: "🔁", customId: `blackjack:restart:${userId}`, style: 2 },
          ])
        }
      ]
    })

    if (game.isGameOver) {
      games.delete(userId);
      return {
        type: 7,
        data: {
          flags: 32768,
          components: [...bustContainer]
        }
      };
    }

    return {
      type: 7,
      data: {
        flags: 32768,
        components: [...hitContainer]
      }
    };
  },
  stand: async (game, userId) => {
    const { player, dealer, result } = game.stand();
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
          text: `**Your cards:** \`${player.map(c => c.display).join(" ")}\` \` ${game.getHandValue(player)} \``
        },
        {
          type: "separator",
          showDivider: false
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealer.map(c => c.display).join(" ")}\` \` ${game.getHandValue(dealer)} \``
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
  },
  restart: async (_game, userId, interaction) => {
    // start a fresh game
    const response = startNewGame(userId, true);

    // if this was a button click, change type 7 so it updates the existing message
    response.type = 7;

    return response;
  }

};

export default blackjack;
export { games, buttonHandlers };
