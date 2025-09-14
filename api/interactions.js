import nacl from "tweetnacl";
import dotenv from "dotenv";

import { commands, commandGames } from "../handlers/cmdIndices.js";
import { commandButtonHandlers } from "../handlers/buttonIndices.js";

dotenv.config();

console.log("Loaded commands:", Object.keys(commands));


export default async function handler(req, res) {
  const signature = req.header("X-Signature-Ed25519");
  const timestamp = req.header("X-Signature-Timestamp");
  const body = req.rawBody;

  if (!signature || !timestamp) return res.status(401).send("Missing signature");

  const isVerified = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(timestamp), body]),
    Buffer.from(signature, "hex"),
    Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
  );

  if (!isVerified) return res.status(401).send("Invalid signature");

  const data = req.body;

  // -----------------------------
  // PING request
  if (data.type === 1) return res.status(200).json({ type: 1 });

  // -----------------------------
  // Slash command
  if (data.type === 2) {
    const command = commands[data.data.name];
    if (!command) {
      return res.status(200).json({ type: 4, data: { flags: 64, content: "❌ Unknown command." } });
    }
    const response = await command.run(data);
    console.dir(response, { depth: null });
    return res.status(200).json(response);
  }

  // -----------------------------
  // Component interaction (buttons)
  if (data.type === 3) {
    const [cmdName, action, userId] = data.data.custom_id.split(":");

    const handlerMap = commandButtonHandlers[cmdName];
    const gameMap = commandGames[cmdName];

    if (!handlerMap) {
      return res.status(200).json({ type: 4, data: { flags: 64, content: "❌ Unknown interaction." } });
    }

    const game = gameMap ? gameMap.get(userId) : null;
    if (!game && action !== "restart") {
      return res.status(200).json({ type: 4, data: { flags: 64, content: "❌ You have no active game. Start a new one!" } });
    }

    const actionHandler = handlerMap[action];
    if (!actionHandler) {
      return res.status(200).json({ type: 4, data: { flags: 64, content: "❌ Unknown button action." } });
    }

    const response = await actionHandler(game, userId, data);
    return res.status(200).json(response);
  }
  
  return res.status(400).send("Unhandled interaction type");
}
