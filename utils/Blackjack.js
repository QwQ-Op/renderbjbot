export default class Blackjack {
  constructor() {
    this.suits = ["♠️", "♥️", "♦️", "♣️"];
    this.valuesOriginal = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    this.values = ["A", "2", "2", "2", "2", "2", "2", "2", "2", "2", "10", "J", "Q", "K"];

    this.playerHands = [[]];
    this.dealer = [];
    this.currentHandIndex = 0;
    this.finishedHands = [];
    this.isGameOver = false;
  }

  drawCard() {
    const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
    const value = this.values[Math.floor(Math.random() * this.values.length)];
    return { value, suit, display: `${value}${suit}` };
  }

  formatHand(hand) {
    return hand.map(c => c.display).join(" ");
  }

  startGame() {
    this.playerHands = [[this.drawCard(), this.drawCard()]];
    this.dealer = [this.drawCard(), this.drawCard()];
    this.isGameOver = false;
    this.currentHandIndex = 0;

    return {
      player: this.playerHands,
      dealer: [this.dealer[0], { display: "❓" }]
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
        cards: [...hand]
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
      cards: [...this.playerHands[this.currentHandIndex]]
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

      if (playerScore > 21) return `${display} Busted 💥`;
      if (dealerScore > 21) return `${display} Dealer busted, you win! 🏆`;
      if (playerScore === dealerScore) return `${display} Tie 🤝`;
      if (playerScore > dealerScore) return `${display} You win! 🏆`;
      return `${display} Dealer wins 😢`;
    });
  }

}
