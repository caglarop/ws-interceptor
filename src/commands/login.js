// src/commands/login.js
const { authenticateUser } = require("../services/authService");
const sendGetRatesRequest = require("../client/packetHandlers/getRatesHandler");

const handler = (ws, msg) => {
  const rid = msg.rid;
  const { username, password } = msg.params;

  const isAuthenticated = authenticateUser(username, password);

  /*
  Example error response for recaptcha verification:
  {
    code: 27,
    rid: 'xyz',
    msg: 'recaptcha verification needed',
    data: ''
  }
  */

  if (isAuthenticated) {
    const response = {
      code: 0,
      rid,
      msg: "Login successful!",
      data: { status: "authenticated" },
    };
    ws.send(JSON.stringify(response));

    // After successful login, send the get_rates request
    sendGetRatesRequest(ws, ["FTN", "USD"]);
  } else {
    const response = {
      code: 12,
      rid: rid,
      msg: "Invalid credentials",
      data: {
        status: 1002,
        details: {
          Key: "InvalidUsernamePassword",
          Message: "Geçersiz Kullanıcı adı ve / veya parola",
        },
      },
    };
    ws.send(JSON.stringify(response));
  }
};

module.exports = handler;
