// src/client/client.js
require("dotenv").config();

const WebSocket = require("ws");
const { handleResponseByRID } = require("./messageRegistry");
const handleSessionRequest = require("./packetHandlers/sessionHandler");

// Establish WebSocket connection
const ws = new WebSocket(process.env.WS_URL);

ws.on("open", () => {
  console.log("[+] Connected to the server");

  // Step 1: Request a session (this is done only once when the connection opens)
  handleSessionRequest(ws);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data);
    console.log("[<] Response from the server:", JSON.stringify(msg, null, 2));

    // When we get a message, we check if it has a 'rid'
    if (msg.rid) {
      // If it has a 'rid', we handle it using the registered handler for that 'rid'
      handleResponseByRID(msg.rid, msg, ws);
    }
  } catch (error) {
    console.error("[!] Error parsing the response:", error);
  }
});

ws.on("close", () => {
  console.log("[x] Connection to the server closed");
});

ws.on("error", (err) => {
  console.error("[!] Connection error:", err);
});
