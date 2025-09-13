import Blackjack from "../utils/Blackjack.js";
import { createButtonsRow, createContainerUI } from "../utils/helpers.js";

const games = new Map();

const blackjack = {
  name: "blackjack",
  description: "Play a game of Blackjack",
  async run(interaction) {
    const userId = interaction.member.user.id;
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
          type: "displaytext",
          text: `**Your cards:** \`${player.map(c => c.display).join(" ")}\` \` ${game.getHandValue(player)} \``,
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealer.map(c => c.display).join(" ")}\` \` ${game.getHandValue([dealer[0]])} \``
        },
        {
          type: 'actionrow',
          row: buttons
        }
      ]
    })
    return {
      type: 4,
      data: {
        flags: 32768,
        components: [...initContainer]
      }
    };

  }
};

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
          type: "displaytext",
          text: `**Your cards:** \`${playerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue(game.player)} \``
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue([game.dealer[0]])} \``
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
          type: "displaytext",
          text: `**Your cards:** \`${playerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue(game.player)} \``
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealerCards.map(c => c.display).join(" ")}\` \` ${game.getHandValue(game.dealer)} \``
        },
        {
          type: "displaytext",
          text: `**Result:** ${game.getResult()}`
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
          type: "displaytext",
          text: `**Your cards:** \`${player.map(c => c.display).join(" ")}\` \` ${game.getHandValue(player)} \``
        },
        {
          type: "displaytext",
          text: `**Dealer's card:** \`${dealer.map(c => c.display).join(" ")}\` \` ${game.getHandValue(dealer)} \``
        },
        {
          type: "displaytext",
          text: `**Result:** ${result}`
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
};

export default blackjack;
export { games, buttonHandlers };
