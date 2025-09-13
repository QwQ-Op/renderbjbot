import nacl from "tweetnacl";
import dotenv from "dotenv";
import invite from "../cmds/invite.js"; // keep as is, bundler will pull this in

dotenv.config();

const commands = {
  invite
};
console.log("Loaded commands:", Object.keys(commands));

export default async function handler(req, res) {
  const signature = req.header("X-Signature-Ed25519");
  const timestamp = req.header("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return res.status(401).send("Missing signature");
  }

const body = req.rawBody; // Buffer

const isVerified = nacl.sign.detached.verify(
  Buffer.concat([Buffer.from(timestamp), body]),
  Buffer.from(signature, "hex"),
  Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
);


  if (!isVerified) {
    return res.status(401).send("Invalid signature");
  }

  const data = req.body;

  // PING request
  if (data.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // Command request
  if (data.type === 2) {
    const command = commands[data.data.name];
    if (command) {
      const response = await command.run(data);
      return res.status(200).json(response);
    } else {
      return res.status(200).json({
        type: 4,
        data: { content: "❌ Unknown command." }
      });
    }
  }

  return res.status(400).send("Unhandled interaction type");
}

