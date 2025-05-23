// src/utils/websocketUtils.js

const WebSocket = require("ws");

/**
 * Sendet eine Nachricht an den Upstream-Socket.
 * Wenn der Socket noch nicht bereit ist, wird die Nachricht in einer Warteschlange gespeichert.
 * Sobald der Upstream-Socket bereit ist, wird die Nachricht gesendet.
 * @param {WebSocket} upstreamSocket Der Upstream-Socket, an den die Nachricht gesendet wird.
 * @param {Object} msg Die zu sendende Nachricht.
 * @param {Array} queue Die Warteschlange für Nachrichten, wenn der Upstream-Socket nicht bereit ist.
 */
const sendToUpstream = (upstreamSocket, msg, queue) => {
  // Wenn der Upstream-Socket noch nicht bereit ist, speichere die Nachricht in der Warteschlange
  if (upstreamSocket.readyState === WebSocket.CONNECTING) {
    console.log("[~] Upstream not ready, buffering message");
    queue.push(msg);
  } else if (upstreamSocket.readyState === WebSocket.OPEN) {
    // Wenn der Upstream-Socket bereit ist, sende die Nachricht
    upstreamSocket.send(JSON.stringify(msg));
    console.log("[>] Sent message to upstream:", msg);
  } else {
    console.warn("[!] Cannot send message: Upstream socket is not open");
  }
};

/**
 * Sende alle gepufferten Nachrichten in der Warteschlange, sobald der Upstream-Socket geöffnet ist.
 * @param {WebSocket} upstreamSocket Der Upstream-Socket.
 * @param {Array} queue Die Warteschlange mit gepufferten Nachrichten.
 */
const flushMessageQueue = (upstreamSocket, queue) => {
  // Sende alle gepufferten Nachrichten, wenn der Upstream-Socket geöffnet ist
  while (queue.length > 0) {
    const msg = queue.shift();
    upstreamSocket.send(JSON.stringify(msg));
    console.log("[>] Sent buffered message to upstream:", msg);
  }
};

module.exports = { sendToUpstream, flushMessageQueue };
