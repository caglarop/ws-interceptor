// src/mitm/commands/request_session.js
const { sendToUpstream } = require("../../utils/websocketUtils");

// src/mitm/commands/request_session.js
const handler = (clientSocket, msg) => {
  try {
    console.log(
      "[+] Modifying request_session response from clientSocket:",
      msg
    );

    const rid = msg.rid;

    // Modify the message as needed
    const sid = generateSID();
    msg.params.sid = sid;
  } catch (e) {
    console.error(
      "[!] Error modifying request_session response from clientSocket:",
      e
    );
  }

  // Send the modified message to the original WebSocket server (Upstream)
  sendToUpstream(
    clientSocket.upstreamSocket,
    msg,
    clientSocket.upstreamSendQueue
  );
};

module.exports = handler;
