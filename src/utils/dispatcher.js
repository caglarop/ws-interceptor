// src/utils/dispatcher.js
const fs = require("fs");
const path = require("path");

class WebSocketDispatcher {
  constructor(commandPath = "commands") {
    this.commands = {};

    // Resolve absolute path to the command directory
    const commandsDir = path.resolve(__dirname, commandPath);

    if (!fs.existsSync(commandsDir)) {
      console.warn(`[!] Command directory does not exist: ${commandsDir}`);
      return;
    }

    // Dynamically load all command handler modules
    const files = fs.readdirSync(commandsDir);

    files.forEach((file) => {
      const commandName = path.basename(file, ".js");
      this.commands[commandName] = require(path.join(commandsDir, file));
    });
  }

  hasCommand(command) {
    return Object.prototype.hasOwnProperty.call(this.commands, command);
  }

  async handleCommand(ws, msg) {
    const { command } = msg;
    const handler = this.commands[command];

    if (handler) {
      return await handler(ws, msg);
    } else {
      console.log("[!] Unknown command:", command);
    }
  }
}

module.exports = WebSocketDispatcher;
