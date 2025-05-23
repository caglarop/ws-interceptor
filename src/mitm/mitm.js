// src/mitm/mitm.js
require("dotenv").config();

// Importing necessary libraries
const WebSocket = require("ws");
const HttpsProxyAgent = require("https-proxy-agent");

// Importing custom modules
const WebSocketDispatcher = require("../utils/dispatcher");
const dispatcher = new WebSocketDispatcher("./src/mitm/commands");

const UpstreamInterceptor = require("../utils/upstreamInterceptor");
const upstreamInterceptor = new UpstreamInterceptor("./src/mitm/interceptors");

const { RateLimiterMemory } = require("rate-limiter-flexible");

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

const {
  flushMessageQueue,
  sendToUpstream,
} = require("../utils/websocketUtils");
const getClientIp = require("../utils/getClientIp");

// Configuration for WebSocket server
const MITM_WS_URL = process.env.MITM_WS_URL; // URL of the original upstream WebSocket server

// Start the local proxy WebSocket server
const wss = new WebSocket.Server({ port: process.env.MITM_WS_PORT }, () => {
  let addr = wss.address().address;
  if (addr === "::" || addr === "0.0.0.0") {
    addr = "localhost";
  }

  console.log(
    `[+] Proxy WebSocket server started on ${
      wss.protocol === "wss" ? "wss" : "ws"
    }://${addr}:${wss.address().port}`
  );

  if (process.env.MITM_PROXY_ENABLED === "true") {
    console.log(`[i] Proxy mode enabled: ${process.env.MITM_PROXY_STRING}`);
  } else {
    console.log("[i] Proxy mode disabled");
  }
});

// Handle incoming client connections
wss.on("connection", (clientSocket, req) => {
  const ip = getClientIp(clientSocket, req);
  console.log(`[+] New connection from IP: ${ip}`);

  // Rate limit connection attempts
  connectionLimiter
    .consume(ip)
    .then(() => {
      console.log(`[+] Connection allowed for IP: ${ip}`);
    })
    .catch(() => {
      console.log(`[!] Connection limit exceeded for IP: ${ip}`);
      clientSocket.close();
      return;
    });

  const proxyEnabled = process.env.MITM_PROXY_ENABLED === "true";
  let upstreamSocket;

  if (proxyEnabled) {
    const proxyUrl = process.env.MITM_PROXY_STRING;
    const agent = new HttpsProxyAgent(proxyUrl);

    console.log(
      `[→] Connecting to original WebSocket server through proxy: ${proxyUrl}`
    );
    upstreamSocket = new WebSocket(MITM_WS_URL, { agent });
  } else {
    console.log("[→] Connecting to original WebSocket server directly");
    upstreamSocket = new WebSocket(MITM_WS_URL);
  }

  clientSocket.upstreamSocket = upstreamSocket;

  // Queue to store messages when the upstream connection is not ready
  clientSocket.upstreamSendQueue = [];

  // When the upstream socket is open, flush the queued messages
  upstreamSocket.on("open", () => {
    console.log("[↥] Connected to original WebSocket server");

    // Send all buffered messages to the upstream server
    flushMessageQueue(upstreamSocket, clientSocket.upstreamSendQueue);
  });

  // Handle messages from the client
  clientSocket.on("message", async (data) => {
    // Rate limit messages
    messageLimiter
      .consume(ip)
      .then(() => {
        try {
          const msg = JSON.parse(data);
          console.log("[<] Received message from client:", msg);

          // Check if the message has a specific command and handle it
          if (dispatcher.hasCommand(msg.command)) {
            console.log(
              "[+] Command found in dispatcher. Handling command:",
              msg.command
            );

            dispatcher
              .handleCommand(clientSocket, msg)
              .then((response) => {
                if (response) {
                  clientSocket.send(JSON.stringify(response));
                }
              })
              .catch((err) => {
                console.log("[!] Error while handling command:", err);
              });

            return;
          }

          // If the message is not handled by the dispatcher, send it to the upstream server
          sendToUpstream(upstreamSocket, msg, clientSocket.upstreamSendQueue);
        } catch (err) {
          console.log("[!] Error parsing message from client:", err);
        }
      })
      .catch(() => {
        console.log(`[!] Message limit exceeded for IP: ${ip}`);
        return;
      });
  });

  // Handle messages from the original WebSocket server (upstream)
  upstreamSocket.on("message", (data) => {
    try {
      const msg = JSON.parse(data);

      console.log("[<] Received message from upstream:", msg);

      // Handle the message with the interceptor
      const handled = upstreamInterceptor.handle(
        msg,
        upstreamSocket,
        clientSocket
      );

      if (!handled) {
        console.log(
          "[!] No interceptor handled the message. Sending to client.",
          msg
        );

        // If the message is not handled, send it unmodified back to the client
        clientSocket.send(data);
      }
    } catch (err) {
      console.log("[!] Error parsing message from upstream:", err);
    }
  });

  // Handle client disconnection
  clientSocket.on("close", () => {
    console.log("[x] Client disconnected");
    upstreamSocket.close(); // Close the upstream connection
  });

  // Handle upstream WebSocket server disconnection
  upstreamSocket.on("close", () => {
    console.log("[x] Disconnected from original server");
    clientSocket.close(); // Close the client connection
  });

  // Handle errors from the client
  clientSocket.on("error", (err) => {
    console.log("[!] Client error:", err.message);
  });

  // Handle errors from the upstream WebSocket server
  upstreamSocket.on("error", (err) => {
    console.log("[!] Upstream server error:", err.message);
  });
});
