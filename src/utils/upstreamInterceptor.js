// src/utils/upstreamInterceptor.js
const fs = require("fs");
const path = require("path");

class UpstreamInterceptor {
  constructor(interceptorPath = "interceptors") {
    this.rules = [];

    // Resolve the path to the interceptor directory
    const interceptorsDir = path.resolve(interceptorPath);

    if (!fs.existsSync(interceptorsDir)) {
      console.warn(
        `[!] Interceptor directory does not exist: ${interceptorsDir}`
      );
      return;
    }

    // Dynamically load all interceptor rule modules
    const files = fs.readdirSync(interceptorsDir);

    files.forEach((file) => {
      const ruleName = path.basename(file, ".js");
      const ruleModule = require(path.join(interceptorsDir, file));

      // Register the rule (assuming each file exports a function)
      if (ruleModule && typeof ruleModule === "function") {
        ruleModule(this);
        console.log(`[+] Loaded interceptor rule: ${ruleName}`);
      } else {
        console.warn(`[!] Invalid interceptor rule: ${ruleName}`);
      }
    });
  }

  /**
   * Register a new interception rule.
   * @param {function(Object): boolean} matchFn - A function that returns true if the message should be intercepted.
   * @param {function(Object, WebSocket, WebSocket): void} handlerFn - Handles the message if matched.
   */
  register(matchFn, handlerFn) {
    this.rules.push({ match: matchFn, handle: handlerFn });
  }

  /**
   * Attempts to match and handle a message.
   * @param {Object} msg - Parsed upstream message.
   * @param {WebSocket} upstreamSocket - The socket from the original server.
   * @param {WebSocket} clientSocket - The client's socket.
   * @returns {boolean} - True if a handler ran, false if message should be forwarded.
   */
  handle(msg, upstreamSocket, clientSocket) {
    for (const rule of this.rules) {
      if (rule.match(msg)) {
        rule.handle(msg, upstreamSocket, clientSocket);
        return true; // handled, don't forward
      }
    }

    return false; // no match, forward as-is
  }
}

module.exports = UpstreamInterceptor;
