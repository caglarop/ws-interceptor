// src/client/packetHandlers/getRatesHandler.js
const { generateRID } = require("../../utils/idGenerator");
const { registerRequestByRID } = require("../messageRegistry");

/**
 * Sends a "get_rates" request to the WebSocket server.
 * @param {WebSocket} ws - The WebSocket connection
 * @param {Array} currencyList - List of currency names to request rates for
 */
const sendGetRatesRequest = (ws, currencyList = ["FTN", "USD"]) => {
  const rid = generateRID();

  // Create the payload for the get_rates request
  const getRatesPayload = {
    command: "get_rates",
    params: {
      currency_name_list: currencyList, // Currencies to request rates for
    },
    rid,
  };

  // Register the handler for the response based on the RID
  registerRequestByRID(rid, (msg, ws) => {
    if (
      msg.code === 0 &&
      msg.data &&
      msg.data.details &&
      msg.data.details.currencies
    ) {
      console.log("[✓] Rates received:");
      msg.data.details.currencies.forEach((currency) => {
        console.log(
          `[Currency: ${currency.currency}] Amount: ${currency.amount} (Fiat: ${currency.fiat})`
        );
      });
    } else {
      console.error("[!] Error or no rates found:", msg);
    }
  });

  // Send the get_rates request to the server
  ws.send(JSON.stringify(getRatesPayload));
  console.log(`[>] GetRates request sent with RID: ${rid}`);
};

module.exports = sendGetRatesRequest;
