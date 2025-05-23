const {
  generateRID,
  generateUserIdentifier,
} = require("../../utils/idGenerator");

/**
 * Generates a payload for the session request (`request_session`).
 * @returns {Object} The request_session payload.
 */
const createRequestSessionPayload = () => {
  const rid = generateRID();
  const afec = generateUserIdentifier(); // Generate dynamic userIdentifier (afec)

  return {
    command: "request_session",
    params: {
      language: "tur",
      site_id: process.env.SITE_ID || 0,
      source: 42,
      release_date: "05/22/2025-15:37",
      afec, // Using generated userIdentifier here
    },
    rid,
  };
};

module.exports = { createRequestSessionPayload };
