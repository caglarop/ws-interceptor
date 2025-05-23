// src/client/messageRegistry.js

/**
 * The message registry where we store our message types and handlers.
 * This will help us dynamically register handlers and call them when a message arrives.
 */
const messageRegistry = {};

/**
 * The registry where we store rids and their associated handlers.
 * We use this to call the correct handler when a message with a specific rid is received.
 */
const ridRegistry = {};

/**
 * Registers a handler for a specific message type.
 * @param {string} messageType - The message type (e.g., 'session', 'login').
 * @param {function} handler - The handler function for this message type.
 */
const registerMessage = (messageType, handler) => {
  messageRegistry[messageType] = handler;
};

/**
 * Registers a handler for a specific request id (rid).
 * @param {string} rid - The request id (rid)
 * @param {function} handler - The handler function for this rid
 */
const registerRequestByRID = (rid, handler) => {
  ridRegistry[rid] = handler;
};

/**
 * Calls the registered handler for the given rid.
 * @param {string} rid - The request id (rid)
 * @param {Object} message - The message to be processed
 * @param {WebSocket} ws - The WebSocket connection
 */
const handleResponseByRID = (rid, message, ws) => {
  if (ridRegistry[rid]) {
    ridRegistry[rid](message, ws); // Call the stored handler
    delete ridRegistry[rid]; // Once the handler is called, remove it from the registry
  } else {
    console.log(`[!] No handler registered for rid: ${rid}`);
  }
};

/**
 * Calls the registered handler for the given message type.
 * @param {string} messageType - The message type (e.g., 'session', 'login').
 * @param {Object} msg - The message to be processed.
 * @param {WebSocket} ws - The WebSocket connection.
 */
const handleMessage = (messageType, msg, ws) => {
  if (messageRegistry[messageType]) {
    messageRegistry[messageType](msg, ws);
  } else {
    console.log(`[!] No handler registered for message type: ${messageType}`);
  }
};

/**
 * Checks if a request id (rid) is registered.
 * @param {*} rid - The request id (rid)
 * @returns {boolean} - True if the rid is registered, false otherwise
 */
const isRIDRegistered = (rid) => {
  return ridRegistry.hasOwnProperty(rid);
};

module.exports = {
  isRIDRegistered,
  registerMessage,
  handleMessage,
  registerRequestByRID,
  handleResponseByRID,
};
