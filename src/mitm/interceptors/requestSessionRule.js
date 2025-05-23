// src/mitm/interceptors/requestSessionRule.js
module.exports = (interceptor) => {
  interceptor.register(
    // Match function: intercept messages where the Key is "InvalidUsernamePassword"
    (msg) => msg?.data?.details?.Key === "InvalidUsernamePassword",
    // Handler function: modify the message and send it to the client
    (msg, upstream, client) => {
      // Modify the message as needed
      msg.data.intercepted = true;

      console.log(
        "[+] Intercepted request_session response from Upstream:",
        msg
      );

      // Send the modified message back to the client
      client.send(JSON.stringify(msg));
    }
  );
};
