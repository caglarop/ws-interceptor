// src/client/packetHandlers/sessionHandler.js
const { registerRequestByRID } = require("../messageRegistry");
const sendGetRatesRequest = require("./getRatesHandler");

const { createLoginPayload } = require("../payloads/loginPayloads");
const { createRequestSessionPayload } = require("../payloads/sessionPayloads");

/**
 * Handles the session request packet.
 * Sends a session request to the WebSocket server.
 * @param {WebSocket} ws - The WebSocket connection
 */
const handleSessionRequest = (ws) => {
  const sessionPayload = createRequestSessionPayload();
  const rid = sessionPayload.rid;

  // Register the handler for the session response using the rid
  registerRequestByRID(rid, (msg, ws) => {
    if (msg.code === 0 && msg.data.sid) {
      console.log("[✓] Session received with SID:", msg.data.sid);

      sendGetRatesRequest(ws, ["FTN", "USD"]);

      // Step 2: Perform login using the received SID
      const loginPayload = createLoginPayload(
        msg.data.sid,
        "abcfaw",
        "abc12WDAda3"
      );

      // Register the handler for the login response using the rid
      registerRequestByRID(loginPayload.rid, (msg, ws) => {
        if (msg.code === 0) {
          console.log("[✓] Login successful!");
          console.log(
            "[<] Response from the server:",
            JSON.stringify(msg, null, 2)
          );
        } else if (msg.code === 12) {
          console.log("[!] Invalid credentials");
          console.log(
            "[<] Response from the server:",
            JSON.stringify(msg, null, 2)
          );
        } else {
          console.log("[!] Login failed with code:", msg.code);
          console.log(
            "[<] Response from the server:",
            JSON.stringify(msg, null, 2)
          );
        }
      });

      ws.send(JSON.stringify(loginPayload));
      console.log(`[>] Login sent with RID: ${loginPayload.rid}`);
    }
  });

  // Send the session request payload to the server
  ws.send(JSON.stringify(sessionPayload));
  console.log(`[>] Request-Session sent with RID: ${sessionPayload.rid}`);
};

module.exports = handleSessionRequest;
