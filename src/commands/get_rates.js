// src/commands/get_rates.js

/**
 * Handles the "get_rates" request packet.
 * Sends a response back with the requested rates.
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Object} msg - The parsed WebSocket message containing the request
 */
const handler = (ws, msg) => {
  const rid = msg.rid;

  // Simulate fetching rates (you can replace this with real data retrieval logic)
  const rates = {
    FTN: 100,
    USD: 1,
  };

  // Prepare response with the rates
  const response = {
    code: 0, // Success code
    rid, // Same RID as in the request
    data: {
      result: 0, // Result code (0 means success)
      details: {
        currencies: Object.keys(rates).map((currency) => ({
          currency: currency,
          amount: rates[currency],
          fiat: currency !== "FTN", // Example: Only FTN is not fiat
        })),
      },
    },
  };

  // Send the response back to the client
  ws.send(JSON.stringify(response));
  console.log(`[<] Rates response sent for RID: ${rid}`);
};

module.exports = handler;
