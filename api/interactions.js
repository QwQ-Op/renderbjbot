import nacl from "tweetnacl";
import dotenv from "dotenv";
dotenv.config();

import { CommandHandler } from "../core/CommandHandler.js";
import { loadCommands } from "../core/cmdLoader.js";

const { commands, buttonHandlers, gameMaps } = await loadCommands("cmds");

const cmdHandler = new CommandHandler({
  commands,
  buttonHandlers,
  games: gameMaps
});

export default async function (req, res) {

  const signature = req.header("X-Signature-Ed25519");
  const timestamp = req.header("X-Signature-Timestamp");
  const body = typeof req.body === "string"
    ? Buffer.from(req.body)
    : Buffer.from(JSON.stringify(req.body));

  if (!signature || !timestamp) {
    return res.status(401).send("Missing signature");
  }

  const isVerified = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(timestamp), body]),
    Buffer.from(signature, "hex"),
    Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
  );

  if (!isVerified) return res.status(401).send("Invalid signature");

  try {
    const data = req.body;
    const response = await cmdHandler.handle(data);
    //console.log("📤 Sending response:", JSON.stringify(response, null, 2));

    if (response) return res.status(200).json(response);
    return res.status(200).end();
  } catch (err) {
    logError(err); // custom function (below)
    return res.status(500).send("Internal Server Error");
  }
}

async function logError(err) {
  try {
    const message = `⚠️ Error: \`\`\`\n${err?.stack || err}\`\`\``;

    const res = await fetch(
      `https://discord.com/api/v10/channels/${process.env.LOG_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${process.env.TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      }
    );
    if (typeof fetch !== "function") {
      console.error("❌ fetch is not defined in this runtime!");
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Failed to send log to Discord:", res.status, text);
    }
  } catch (sendErr) {
    console.error("❌ logError() itself failed:", sendErr);
    console.error("Original error:", err);
  }
}
