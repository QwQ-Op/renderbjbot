import invite from "../cmds/invite.js";
import blackjack, { games as blackjackGames } from "../cmds/blackjack.js";

export const commands = {
  invite,
  blackjack,
};

export const commandGames = {
  blackjack: blackjackGames,
};
