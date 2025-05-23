// src/commands/request_session.js
const { generateSID } = require("../utils/idGenerator");

const handler = (ws, msg) => {
  const rid = msg.rid;
  const sid = generateSID();

  const response = {
    code: 0,
    rid,
    data: {
      version: "1.0.0",
      sid: sid,
      host: "",
      ip: "",
      recaptcha_version: 3,
      recaptcha_enabled: true,
      site_key: "",
      ctx: {
        site: 0,
        k_type: "None",
        tree_mode: "dict",
      },
      recaptcha_actions: [
        "reset_password",
        "send_sms",
        "send_verification_code",
      ],
    },
  };

  ws.send(JSON.stringify(response));
};

module.exports = handler;
