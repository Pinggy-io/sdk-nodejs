# Pinggy SDK - JavaScript Example

This example demonstrates how to use the Pinggy SDK in a Node.js JavaScript project.

## Installation

```bash
npm install pinggy
```

## Basic Usage

### Simple Tunnel Creation

```javascript
const { pinggy } = require("pinggy");

(async () => {
  // Create and start a tunnel
  const tunnel = await pinggy.forward({ forwardTo: "localhost:3000" });
  console.log("Tunnel URLs:", tunnel.urls());

  // Stop the tunnel when done
  setTimeout(() => {
    tunnel.stop();
  }, 10000);
})();
```

### Multiple Tunnels

```javascript
const { pinggy } = require("pinggy");

(async () => {
  // Create multiple tunnels
  const tunnel1 = pinggy.createTunnel({ forwardTo: "localhost:3000" });
  const tunnel2 = pinggy.createTunnel({ forwardTo: "localhost:4000" });

  await tunnel1.start();
  await tunnel2.start();

  console.log("Tunnel 1 URLs:", tunnel1.urls());
  console.log("Tunnel 2 URLs:", tunnel2.urls());

  // Get all active tunnels
  const allTunnels = pinggy.getAllTunnels();
  console.log("Total tunnels:", allTunnels.length);

  // Close all tunnels
  setTimeout(() => {
    pinggy.closeAllTunnels();
  }, 10000);
})();
```

## Configuration Options

The `PinggyOptions` object supports the following configuration options:

### Basic Options

| Option          | Type      | Default             | Description                               |
| --------------- | --------- | ------------------- | ----------------------------------------- |
| `forwardTo`     | `string`  | `"localhost:4000"`  | Local address to forward traffic to       |
| `token`         | `string`  | -                   | Authentication token for premium features |
| `serverAddress` | `string`  | `"a.pinggy.io:443"` | Pinggy server address                     |
| `sniServerName` | `string`  | `"a.pinggy.io"`     | SNI server name for SSL                   |
| `type`          | `string`  | `"http"`            | Tunnel type: `"http"`, `"tcp"`, `"udp"`   |
| `ssl`           | `boolean` | `true`              | Enable/disable SSL                        |

### Security Options

| Option        | Type       | Description                                          |
| ------------- | ---------- | ---------------------------------------------------- |
| `ipWhitelist` | `string[]` | List of allowed IP addresses                         |
| `basicAuth`   | `object`   | Basic HTTP authentication `{ username: "password" }` |
| `bearerAuth`  | `string[]` | Bearer token authentication                          |

### HTTP Options

| Option           | Type      | Default | Description                   |
| ---------------- | --------- | ------- | ----------------------------- |
| `httpsOnly`      | `boolean` | `false` | Force HTTPS only              |
| `fullRequestUrl` | `boolean` | `false` | Include full URL in requests  |
| `allowPreflight` | `boolean` | `false` | Allow preflight CORS requests |
| `noReverseProxy` | `boolean` | `false` | Disable reverse proxy         |
| `xff`            | `boolean` | `false` | Add X-Forwarded-For header    |

### Header Modification

```javascript
headerModification: [
  {
    action: "add", // "add", "remove", or "update"
    key: "X-Custom-Header",
    value: "custom-value",
  },
];
```

### Command Options

| Option | Type     | Description                            |
| ------ | -------- | -------------------------------------- |
| `cmd`  | `string` | Custom command to prepend to arguments |

## Complete Example

```javascript
const { pinggy } = require("pinggy");

(async () => {
  const options = {
    forwardTo: "localhost:3000",
    token: "your-premium-token",
    type: "http",
    ssl: true,
    httpsOnly: true,
    xff: true,
    ipWhitelist: ["192.168.1.0/24", "10.0.0.1"],
    basicAuth: { admin: "password123" },
    bearerAuth: ["bearer-token-1"],
    headerModification: [
      { action: "add", key: "X-Custom", value: "myapp" },
      { action: "remove", key: "X-Unwanted" },
    ],
  };

  const tunnel = await pinggy.forward(options);

  console.log("Tunnel URLs:", tunnel.urls());
  console.log("Server Address:", tunnel.getServerAddress());
  console.log("Status:", tunnel.getStatus());

  // Start web debugging interface
  tunnel.startWebDebugging(8080);
  console.log("Web debugging available at: http://localhost:8080");

  // Request additional forwarding
  tunnel.tunnelRequestAdditionalForwarding(
    "custom.pinggy.io:443",
    "localhost:6000"
  );

  // Monitor tunnel status
  setInterval(() => {
    console.log("Tunnel active:", tunnel.isActive());
    console.log("Tunnel status:", tunnel.getStatus());
  }, 5000);

  // Graceful shutdown after 30 seconds
  setTimeout(() => {
    console.log("Shutting down tunnel...");
    tunnel.stop();
    console.log("Tunnel stopped.");
  }, 30000);
})();
```

## API Reference

### Main API

- `pinggy.createTunnel(options)` - Create a tunnel instance (not started)
- `pinggy.forward(options)` - Create and start a tunnel
- `pinggy.getAllTunnels()` - Get all active tunnels
- `pinggy.closeAllTunnels()` - Stop all active tunnels

### Tunnel Instance Methods

- `tunnel.start()` - Start the tunnel
- `tunnel.stop()` - Stop the tunnel
- `tunnel.urls()` - Get public URLs
- `tunnel.isActive()` - Check if tunnel is active
- `tunnel.getStatus()` - Get tunnel status: `"starting"`, `"live"`, or `"closed"`
- `tunnel.getServerAddress()` - Get Pinggy server address
- `tunnel.getToken()` - Get tunnel token
- `tunnel.startWebDebugging(port)` - Start web debugging interface
- `tunnel.tunnelRequestAdditionalForwarding(hostname, target)` - Request additional forwarding

## Error Handling

```javascript
const { pinggy } = require("pinggy");

(async () => {
  try {
    const tunnel = await pinggy.forward({ forwardTo: "localhost:3000" });
    console.log("Tunnel started:", tunnel.urls());
  } catch (error) {
    console.error("Failed to start tunnel:", error.message);
  }
})();
```

## Best Practices

1. **Always handle errors** when creating tunnels
2. **Stop tunnels** when your application exits
3. **Use `pinggy.closeAllTunnels()`** for cleanup
4. **Monitor tunnel status** for production applications
5. **Use authentication** options for security
