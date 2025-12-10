# Pinggy SDK - JavaScript Example

This example demonstrates how to use the Pinggy SDK in a Node.js JavaScript project.

## Installation

```bash
npm install @pinggy/pinggy
```

## Basic Usage

### Simple Tunnel Creation

```javascript
const { pinggy } = require("@pinggy/pinggy");

(async () => {
  // Create and start a tunnel
  const tunnel = await pinggy.forward({ forwardTo: "localhost:3000" });
  console.log("Tunnel URLs:", await tunnel.urls());

  // Stop the tunnel when done
  setTimeout(() => {
    tunnel.stop();
  }, 10000);
})();
```

### Multiple Tunnels

```javascript
const { pinggy } = require("@pinggy/pinggy");

(async () => {
  // Create multiple tunnels
  const tunnel1 = await pinggy.createTunnel({ forwardTo: "localhost:3000" });
  const tunnel2 = await pinggy.createTunnel({ forwardTo: "localhost:4000" });

  await tunnel1.start();
  await tunnel2.start();

  console.log("Tunnel 1 URLs:", await tunnel1.urls());
  console.log("Tunnel 2 URLs:", await tunnel2.urls());

  // Get all active tunnels
  const allTunnels = pinggy.getAllTunnels();
  console.log("Total tunnels:", allTunnels.length);

  // Close all tunnels
  setTimeout(() => {
    pinggy.closeAllTunnels();
  }, 10000);
})();
```

## Detailed documentation

For detailed usage, API reference, and examples, see the Pinggy Node.js SDK documentation: [Pinggy SDK for Node.js](https://pinggy-io.github.io/sdk-nodejs/).




## Best Practices

1. **Always handle errors** when creating tunnels
2. **Stop tunnels** when your application exits
3. **Use `pinggy.closeAllTunnels()`** for cleanup
4. **Monitor tunnel status** for production applications
5. **Use authentication** options for security
