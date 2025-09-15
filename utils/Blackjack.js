const bqq = "<:bqq1:1417041472984711218><:bqq2:1417041497005621268>";
const rqq = "<:rqq1:1417041425002004491><:rqq2:1417041448964198400>";
const hide = Math.random() > 0.49 ? bqq : rqq;
export default class Blackjack {
  constructor(seeds = Date.now()) {
    this.seed = seeds
    this.random = this.createRandomSeed(this.seed);

    this.deck = this.createDeck(1)
    this.playerHands = [[]];
    this.dealer = [];
    this.currentHandIndex = 0;
    this.finishedHands = [];
    this.isGameOver = false;
  }

  createDeck(numOfDecks) {
    const suits = [
      { suit: '<:ss:1417040752499753010>', color: 'black', symbol: '♠️' },  // Spades (black)
      { suit: '<:hh:1417040776877047848>', color: 'red', symbol: '♥️' },    // Hearts (red)
      { suit: '<:dd:1417040801690685512>', color: 'red', symbol: '♦️' },    // Diamonds (red)
      { suit: '<:cc:1417040825812258897>', color: 'black', symbol: '♣️' }   // Clubs (black)
    ];
    const redValues = {
      "2": "<:r2:1417038579095306261>",
      "3": "<:r3:1417038604957515899>",
      "4": "<:r4:1417038628407742477>",
      "5": "<:r5:1417038652680306708>",
      "6": "<:r6:1417038676390580226>",
      "7": "<:r7:1417038701162139698>",
      "8": "<:r8:1417038725044502570>",
      "9": "<:r9:1417038749837299792>",
      "10": "<:r10:1417038773417414738>",
      "A": "<:ra:1417038870129807403>",
      "J": "<:rj:1417038797903892520>",
      "Q": "<:rq:1417038822159421483>",
      "K": "<:rk:1417038846348099584>"
    };
    const blackValues = {
      "2": "<:b2:1417038894448377937>",
      "3": "<:b3:1417038918636933161>",
      "4": "<:b4:1417038943043584075>",
      "5": "<:b5:1417038967227940935>",
      "6": "<:b6:1417038991227617382>",
      "7": "<:b7:1417039015185743996>",
      "8": "<:b8:1417039039852318720>",
      "9": "<:b9:1417039064821141598>",
      "10": "<:b10:1417039088950968400>",
      "A": "<:ba:1417039185281286155>",
      "J": "<:bj:1417039112535412819>",
      "Q": "<:bq:1417039136870891550>",
      "K": "<:bk:1417039160707125311>"
    };

    let deck = [];
    for (let i = 0; i < numOfDecks; i++) {
      for (let suitObj of suits) {
        const valueSet = suitObj.color === 'red' ? redValues : blackValues;

        for (let value in valueSet) {
          deck.push({
            suitSym: suitObj.symbol,
            suitCol: suitObj.color,
            suit: suitObj.suit,         // The suit emoji
            value: value,                      // The card value (e.g., '2', 'A')
            display: `${valueSet[value]}${suitObj.suit}`    // The emoji representation for display
          });
        }
      }
    }
    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck) {
    // how many times to riffle shuffle
    const shuffles = 7;  
  
    for (let s = 0; s < shuffles; s++) {
      // cut deck near the middle (but with a little randomness)
      const cutPoint = Math.floor(deck.length / 2 + (this.random() - 0.5) * 10);
      const left = deck.slice(0, cutPoint);
      const right = deck.slice(cutPoint);
  
      const shuffled = [];
  
      // interleave left + right
      while (left.length > 0 || right.length > 0) {
        // probability bias towards alternating but still random
        if (left.length > 0 && (right.length === 0 || this.random() > 0.5)) {
          shuffled.push(left.shift());
        }
        if (right.length > 0 && (left.length === 0 || this.random() > 0.5)) {
          shuffled.push(right.shift());
        }
      }
  
      deck = shuffled;
    }
  
    return deck;
  }
  

  drawCard() {
    const cardFromDeck = this.deck.pop();
    return cardFromDeck;
  }

  createRandomSeed(seed) {
    let state = seed;
    return function () {
      // Simple LCG (Linear Congruential Generator)
      state = (state * 1664525 + 1013904223) % 4294967296;
      return (state / 4294967296); // returns a value between 0 and 1
    };
  }

  formatHand(hand) {
    const genericSuits = ["♠️", "♥️", "♦️", "♣️"];

    return hand
      .map(c => (genericSuits.includes(c.display) ? `\`${c.display}\`` : c.display))
      .join(
        hand.some(c => genericSuits.includes(c.display)) ? " " : ""
      );
  }


  dealerInitialCards() {
    return [this.dealer[0], { display: hide }]
  }

  startGame() {
    this.playerHands = [[this.drawCard(), this.drawCard()]];
    this.dealer = [this.drawCard(), this.drawCard()];
    this.isGameOver = false;
    this.currentHandIndex = 0;

    return {
      player: this.playerHands,
      dealer: this.dealerInitialCards()
    };
  }

  hit() {
    let busted = false;

    if (this.isGameOver) return {
      hands: this.playerHands,
      gameOver: true,
      busted,
      handIndex: this.currentHandIndex,
    };

    const hand = this.playerHands[this.currentHandIndex];
    const card = this.drawCard();
    hand.push(card);

    if (this.getHandValue(hand) > 21) {
      // bust → move to next hand
      busted = true;
      this.finishedHands.push({
        index: this.currentHandIndex,
        cards: [...hand],
        resultEmoji: "🔳"
      });

      if (this.currentHandIndex < this.playerHands.length - 1) {
        this.currentHandIndex++;
      } else {
        this.isGameOver = true;
      }
    }
    return {
      hands: this.playerHands,
      gameOver: this.isGameOver,
      busted,
      handIndex: this.currentHandIndex,
    };
  }

  stand() {
    this.finishedHands.push({
      index: this.currentHandIndex,
      cards: [...this.playerHands[this.currentHandIndex]],
      resultEmoji: "🔳"
    });
    if (this.isGameOver) {
      return {
        player: this.playerHands,
        dealer: this.dealer,
        next: false,
        handIndex: this.currentHandIndex,
        result: this.getFinalResults()
      };
    }
    // Move through all remaining hands
    if (this.currentHandIndex < this.playerHands.length - 1) {
      this.currentHandIndex++;
      return {
        player: this.playerHands,
        dealer: this.dealer,
        next: true,
        handIndex: this.currentHandIndex,
      };
    }

    //Dealer plays only after last hand
    while (this.getHandValue(this.dealer) < 17) {
      this.dealer.push(this.drawCard());
    }

    this.isGameOver = true;
    return {
      player: this.playerHands,
      dealer: this.dealer,
      next: false,
      handIndex: this.currentHandIndex,
      result: this.getFinalResults()
    };
  }

  split() {
    const hand = this.playerHands[this.currentHandIndex];
    if (hand.length !== 2 || hand[0].value !== hand[1].value) return false;

    const [card1, card2] = hand;

    // replace current hand with the first split hand
    this.playerHands.splice(this.currentHandIndex, 1, [card1], [card2]);

    // give one new card to each hand
    this.playerHands[this.currentHandIndex].push(this.drawCard());
    this.playerHands[this.currentHandIndex + 1].push(this.drawCard());

    return true;
  }


  getHandValue(hand) {
    let total = 0, aces = 0;
    for (const card of hand) {
      if (card.value === "A") { total += 11; aces++; }
      else if (["J", "Q", "K"].includes(card.value)) total += 10;
      else total += parseInt(card.value);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }

  canSplit(handIndex = this.currentHandIndex) {
    const hand = this.playerHands[handIndex];
    if (hand.length !== 2) return false;
    return hand[0].value === hand[1].value; // same rank → splittable
  }

  getFinalResults() {
    const dealerScore = this.getHandValue(this.dealer);

    return this.playerHands.map((hand, i) => {
      const playerScore = this.getHandValue(hand);
      const display = this.playerHands.length > 1 ? `Hand ${i + 1}:` : '';
      let result;
      let emoji = "🤝";

      if (playerScore > 21) {
        result = `${display} Busted 💥`;
        emoji = "💥";
      } else if (dealerScore > 21) {
        result = `${display} Dealer busted, you win! 🏆`;
        emoji = "🏆";
      } else if (playerScore === dealerScore) {
        result = `${display} Tie 🤝`;
        emoji = "🤝";
      } else if (playerScore > dealerScore) {
        result = `${display} You win! 🏆`;
        emoji = "🏆";
      } else {
        result = `${display} Dealer wins 😢`;
        emoji = "😢";
      }

      // also update finishedHands if it exists
      if (this.finishedHands) {
        const fHand = this.finishedHands.find(h => h.index === i);
        if (fHand) fHand.resultEmoji = emoji;
      }

      return result;
    }).join("\n");
  }

}
