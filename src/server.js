// src/server.js
require("dotenv").config();

const WebSocket = require("ws");
const logger = require("./utils/logger");

const WebSocketDispatcher = require("./utils/dispatcher");
const dispatcher = new WebSocketDispatcher("../commands");

const { RateLimiterMemory } = require("rate-limiter-flexible");
const getClientIp = require("./utils/getClientIp");

// Limit: Max 20 connection attempts per IP in 5 seconds
const connectionLimiter = new RateLimiterMemory({
  points: 20, // Maximum number of connections
  duration: 5, // Per 5 seconds
});

// Limit: Max 100 messages per IP in 5 seconds
const messageLimiter = new RateLimiterMemory({
  points: 100, // Maximum number of messages
  duration: 5, // Per 5 seconds
});

const wss = new WebSocket.Server({ port: process.env.WS_PORT || 8080 });

wss.on("connection", (ws, req) => {
  const ip = getClientIp(ws, req);

  logger.log(`[+] New connection from IP: ${ip}`);

  // Rate limit connection attempts
  connectionLimiter
    .consume(ip)
    .then(() => {
      logger.log(`[+] Connection allowed for IP: ${ip}`);
    })
    .catch(() => {
      logger.log(`[!] Connection limit exceeded for IP: ${ip}`);
      ws.close();
    });

  ws.on("message", (data) => {
    // Rate limit messages
    messageLimiter
      .consume(ip)
      .then(() => {
        try {
          const msg = JSON.parse(data);
          logger.log("[+] Received message from client:", msg);

          dispatcher
            .handleCommand(ws, msg)
            .then((response) => {
              if (response) {
                ws.send(JSON.stringify(response));
              }
            })
            .catch((err) => {
              logger.log("[!] Error while handling command:", err);
            });
        } catch (err) {
          logger.log("[!] Error while parsing message from client:", err);
        }
      })
      .catch(() => {
        logger.log(`[!] Message limit exceeded for IP: ${ip}`);
      });
  });

  ws.on("close", () => {
    logger.log("[x] Client disconnected");
  });

  ws.on("error", (err) => {
    logger.log("[!] Error while handling connection:", err);
  });
});

let addr = wss.address().address;
if (addr === "::" || addr === "0.0.0.0") {
  addr = "localhost";
}

logger.log(
  `[+] WebSocket server started on ${
    wss.protocol === "wss" ? "wss" : "ws"
  }://${addr}:${wss.address().port}`
);
logger.log("[+] Waiting for connections...");
