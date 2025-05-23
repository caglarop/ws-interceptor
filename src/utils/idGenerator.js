// src/utils/idGenerator.js
const crypto = require("crypto");

/**
 * Generates a unique Session ID (SID).
 * This function uses Node's built-in `crypto` module to generate a secure random value.
 * The SID is generated as a 16-byte random string encoded in hexadecimal.
 * SID is often used to uniquely identify a session in web applications.
 * @returns {string} The generated Session ID (SID).
 */
const generateSID = () => {
  // `crypto.randomBytes(16)` generates 16 bytes (128 bits) of random data
  // `.toString("hex")` converts the random bytes into a hexadecimal string representation
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Generates a unique alphanumeric Request ID (RID) of exactly 36 characters.
 * Uses Node.js `crypto` module to generate secure random bytes, then encodes as base-36.
 * @returns {string} A 36-character alphanumeric request ID
 */
const generateRID = () => {
  // 36 base36 characters ~ 18 bytes (because each byte ≈ 1.6 base36 characters)
  return crypto.randomBytes(24).toString("base64url").substring(0, 36);
};

/**
 * Generates a unique user identifier (afec).
 * This function generates a random string that acts as a unique identifier for a user session or action.
 * The `afec` identifier is typically used to uniquely identify a user on the server-side.
 * This is achieved by generating another random alphanumeric string, similar to `generateRID()`.
 * @returns {string} The generated user identifier (afec).
 */
const generateUserIdentifier = () => {
  // Similar to `generateRID()`, this function generates a random alphanumeric string.
  // It can be used for identifying users or tracking sessions on the server.
  return Math.random().toString(36).substring(2, 38); // Random alphanumeric string, length 36
};

// Export the functions so they can be used elsewhere in the application
module.exports = { generateSID, generateRID, generateUserIdentifier };
