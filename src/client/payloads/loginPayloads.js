const { generateRID } = require("../../utils/idGenerator");

/**
 * Generates a payload for login with the received SID.
 * @param {string} sid - The received session ID.
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @returns {Object} The login payload.
 */
const createLoginPayload = (sid, username, password) => {
  const rid = generateRID();

  return {
    command: "login",
    params: {
      username,
      password,
      encrypted_token: true,
    },
    rid,
    sid,
  };
};

module.exports = { createLoginPayload };
