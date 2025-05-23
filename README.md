# WebSocket Interception & Emulator Framework

This project provides a flexible toolkit for developing, testing, and intercepting WebSocket-based applications. It includes tools for emulating WebSocket servers, simulating clients, and acting as a man-in-the-middle (MITM) proxy to inspect and manipulate WebSocket traffic. The framework is ideal for debugging, reverse engineering, and extending WebSocket protocols in a controlled environment.

It provides three key components:

- **Local WebSocket Server (`server.js`)** — a standalone emulator with custom commands.
- **Test Client (`client.js`)** — a basic client to simulate behavior and test server logic.
- **MITM Proxy (`mitm.js`)** — a "man-in-the-middle" proxy to intercept and manipulate messages between the original server and client.

## ⚠️ Disclaimer

> This project is for **educational and testing purposes only**. Do not use it to intercept or manipulate traffic you do not own or have explicit permission to work with.

## 🛠 Features

- Custom command handling (via `/commands` directory)
- Dynamic message dispatching
- Message and connection rate limiting
- MITM WebSocket proxy with interception hooks
- Optional support for upstream HTTPS proxies
- Environment-based configuration

## 📁 Project Structure

```
src/
├── client/           # Test client logic
│   ├── packetHandlers
│   ├── payloads
│   └── utils
├── commands/         # Custom command handlers for the emulator
├── interceptors/     # Hooks for modifying messages in the emulator (server.js)
├── mitm/             # MITM proxy logic
│   ├── commands      # MITM-specific command handlers
│   └── interceptors  # Hooks for modifying upstream/downstream messages
├── services/         # (Optional) Additional backend services
├── utils/            # Shared utilities (e.g. getClientIp.js)
├── server.js         # Custom emulator WebSocket server

```

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/caglarop/ws-interceptor.git
cd ws-interceptor
npm install
```

### 2. Configure `.env`

Create a `.env` file in the root with the following content:

```env
# Server
WS_PORT=8080

# MITM
MITM_PROXY_ENABLED=false
MITM_PROXY_STRING=http://user:pass@proxyhost:port
MITM_WS_PORT=8080
MITM_WS_URL=wss://example.com

# Client
WS_URL=ws://localhost:8080
```

## 🔧 Available Scripts

```bash
npm run start             # Starts the custom WebSocket server
npm run start:server      # Same as above
npm run start:client      # Starts test client
npm run start:mitm        # Starts MITM WebSocket proxy
```

## 🧪 Usage Examples

### Start Emulator Server

```bash
npm run start:server
```

Use this to test your own WebSocket handlers with the `commands/` directory.

### Start MITM Proxy

```bash
npm run start:mitm
```

This starts a proxy server between the original WebSocket server and a real client (e.g. a game in the browser). You can modify requests/responses by adding logic to:

- `src/mitm/interceptors/` for upstream (server-to-client) manipulation
- `src/mitm/commands/` for handling client commands

### Start Client for Testing

```bash
npm run start:client
```

Simulates a client connecting to the emulator or MITM. Good for unit testing specific messages.

### Add Custom Commands

To handle custom client messages, add a file to `src/commands/` (for the emulator) or `src/mitm/commands/` (for the MITM proxy).  
Each file should export a handler function with the signature `(ws, msg) => { ... }`.

**Example: `src/commands/login.js`**

```js
const { authenticateUser } = require("../services/authService");
const sendGetRatesRequest = require("../client/packetHandlers/getRatesHandler");

const handler = (ws, msg) => {
  const rid = msg.rid;
  const { username, password } = msg.params;

  const isAuthenticated = authenticateUser(username, password);

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
```

### Add Interceptors

Interceptors allow you to inspect or modify messages as they pass through the MITM proxy.  
Place your interceptor files in `src/mitm/interceptors/`. Each interceptor registers a filter and a handler.

**Example: `src/mitm/interceptors/echo.js`**

```js
module.exports = (interceptor) => {
  interceptor.register(
    (msg) => msg.type === "echo", // Filter: only handle "echo" messages
    (msg, upstream, client) => {
      msg.data = "[+] Intercepted!";
      client.send(JSON.stringify(msg));
    }
  );
};
```

**How interceptors work:**

- The first argument is a filter function: return `true` if the message should be intercepted.
- The second argument is the handler: you can modify the message, block it, or send a custom response.

## 📜 License

ISC — use at your own risk and responsibility.
