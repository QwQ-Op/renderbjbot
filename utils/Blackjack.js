export default class Blackjack {
    constructor() {
      this.suits = ["♠️", "♥️", "♦️", "♣️"];
      this.values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  
      this.player = [];
      this.dealer = [];
      this.isGameOver = false;
    }
  
    drawCard() {
      const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
      const value = this.values[Math.floor(Math.random() * this.values.length)];
      return { value, suit, display: `${value}${suit}` };
    }
  
    startGame() {
      this.player = [this.drawCard(), this.drawCard()];
      this.dealer = [this.drawCard(), this.drawCard()];
      this.isGameOver = false;
      return {
        player: this.player,
        dealer: [this.dealer[0], { display: "❓" }]
      };
    }
  
    hit() {
      if (this.isGameOver) return null;
      const card = this.drawCard();
      this.player.push(card);
      if (this.getHandValue(this.player) > 21) this.isGameOver = true; // bust
      return this.player;
    }
  
    stand() {
      if (this.isGameOver) return null;
  
      while (this.getHandValue(this.dealer) < 17) {
        this.dealer.push(this.drawCard());
      }
  
      this.isGameOver = true;
      return {
        player: this.player,
        dealer: this.dealer,
        result: this.getResult()
      };
    }
  
    getHandValue(hand) {
      let total = 0, aces = 0;
      for (const card of hand) {
        if (card.value === "A") { total += 11; aces++; }
        else if (["J","Q","K"].includes(card.value)) total += 10;
        else total += parseInt(card.value);
      }
      while (total > 21 && aces > 0) { total -= 10; aces--; }
      return total;
    }
  
    getResult() {
      const playerScore = this.getHandValue(this.player);
      const dealerScore = this.getHandValue(this.dealer);
  
      if (playerScore > 21) return "You busted! 💥";
      if (dealerScore > 21) return "Dealer busted! You win! 🏆";
      if (playerScore === dealerScore) return "It's a tie! 🤝";
      if (playerScore > dealerScore) return "You win! 🏆";
      return "Dealer wins! 😢";
    }
  }
  