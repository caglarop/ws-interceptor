// src/services/authService.js
const authenticateUser = (username, password) => {
  return username === "abc" && password === "abc123";
};

module.exports = { authenticateUser };
