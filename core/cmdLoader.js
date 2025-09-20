import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export async function loadCommands(dir = "cmds") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const commands = {};
  const buttonHandlers = {};
  const gameMaps = {};
  
  const files = fs.readdirSync(path.join(__dirname, "..", dir));

  for (const file of files.filter(f => f.endsWith(".js"))) {
    const mod = await import(`../${dir}/${file}`);
    const cmd = mod.default;

    if (!cmd?.name) continue;

    commands[cmd.name] = cmd;

    if (cmd.buttons) {
      buttonHandlers[cmd.name] = cmd.buttons;
    }
    if (cmd.gameMap) {
      gameMaps[cmd.name] = cmd.gameMap;
    }
  }

  return { commands, buttonHandlers, gameMaps };
}
