# Pinggy Node.js SDK

`@pinggy/pinggy` is the official Node.js SDK for [Pinggy](http://pinggy.io/)

This guide will help you get started with installation, creating tunnels, managing multiple tunnels, and using advanced features.


## Installation

Install the SDK via npm:

```bash
npm i @pinggy/pinggy
```

> **Compatibility Note:**
>
> - The Pinggy SDK only works on:
>   - **Node.js 18 or newer** for **Linux x64**, **Linux arm64**, and **Windows x64**
>   - **Node.js 19 or newer** for **Windows arm64**
> - Other platforms and Node.js versions are not supported as of now.


## Quick Start

### Import the SDK

```ts
import { pinggy } from "@pinggy/pinggy";
```

### Create and Start a Tunnel

```ts
const tunnel = pinggy.createTunnel({ forwardTo: "localhost:3000" });
await tunnel.start();
console.log("Tunnel URLs:", tunnel.urls()); // Get all public addresses
```

Find complete examples at [examples](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples)


## Managing Multiple Tunnels

You can create and manage multiple tunnels simultaneously:

```ts
const tunnel1 = pinggy.createTunnel({ forwardTo: "localhost:3000" });
const tunnel2 = pinggy.createTunnel({ forwardTo: "localhost:4000" });
await tunnel1.start();
await tunnel2.start();
console.log("Tunnel 1 URLs:", tunnel1.urls());
console.log("Tunnel 2 URLs:", tunnel2.urls());
```

Or use the convenient `forward` method:

```ts
const tunnel = await pinggy.forward({ forwardTo: "localhost:5000" });
console.log("Tunnel URLs:", tunnel.urls());
```

---

## Examples

[Degit](https://www.npmjs.com/package/degit) can be used for cloning and running an example directory like this:

```bash
npx degit github:Pinggy-io/sdk-nodejs/examples/<example> <folder-name>
cd <folder-name>
npm i
```

For example:

```bash
npx degit github:Pinggy-io/sdk-nodejs/examples/express express && cd express && npm i
```

### Available Examples

- **[Next.js](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples/nextjs)** - Next.js with Pinggy tunneling
  ```bash
  npx degit github:Pinggy-io/sdk-nodejs/examples/nextjs nextjs-example
  cd nextjs-example && npm i
  npm run dev
  ```

- **[JavaScript](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples/js)** - Basic JavaScript usage examples
  ```bash
  npx degit github:Pinggy-io/sdk-nodejs/examples/js js-example
  cd js-example && npm i
  ```

- **[TypeScript](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples/ts)** - TypeScript examples with full type safety
  ```bash
  npx degit github:Pinggy-io/sdk-nodejs/examples/ts ts-example
  cd ts-example && npm i
  ```

- **[Express](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples/express)** - Using `pinggy.listen` with Express

  ```bash
  npx degit github:Pinggy-io/sdk-nodejs/examples/express express-example
  cd express-example && npm i
  node express-listen-example.js
  ```


**Note:** Each example includes its own README with detailed setup and usage instructions.


## Tunnel Management

- **Get all public URLs for a tunnel:**
  ```ts
  const urls = tunnel.urls(); // array of public addresses
  console.log("Tunnel URLs:", urls);
  ```
  - **Check tunnel status:**
  ```ts
  tunnel.getStatus(); // "starting" | "live" | "closed"
  ```
- **Check if tunnel is active:**
  ```ts
  tunnel.isActive(); // true or false
  ```
- **Stop a tunnel:**
  ```ts
  tunnel.stop();
  ```
- **Close all tunnels:**
  ```ts
  pinggy.closeAllTunnels();
  ```

---

## Advanced Features

- **Start web debugging:**
  ```ts
  tunnel.startWebDebugging(8080); // Starts web debugging on localhost:8080
  ```
- **Request additional forwarding:**
  ```ts
  tunnel.tunnelRequestAdditionalForwarding(
    "custom.pinggy.io:443",
    "localhost:6000"
  );
  ```

---

## API Reference

### Imports

```ts
import {
  pinggy,
  TunnelInstance,
  type PinggyOptions,
  listen,
} from "@pinggy/pinggy";
```

### `pinggy`

- `createTunnel(options: PinggyOptions): TunnelInstance` — Create a new tunnel (does not start it).
- `forward(options: PinggyOptions): Promise<TunnelInstance>` — Create and start a tunnel, returns the instance when ready.
- `closeAllTunnels(): void` — Stop and remove all tunnels.

### `TunnelInstance`

- `start(): Promise<string[]>` — Start the tunnel.
- `stop(): void` — Stop the tunnel and clean up resources.
- `isActive(): boolean` — Check if the tunnel is active.
- `getStatus(): "starting" | "live" | "closed"` — Get the tunnel's current status.
- `urls(): string[]` — **Get the array of public addresses returned by the tunnel's primary forwarding callback.**
- `getServerAddress(): string | null` — **Get the address of the Pinggy backend server this tunnel is connected to.**
- `getToken(): string | null` — Get the tunnel token.
- `startWebDebugging(port: number): void` — Start web debugging on a local port.
- `tunnelRequestAdditionalForwarding(hostname: string, target: string): void` — Request additional forwarding.

### `PinggyOptions`

The `PinggyOptions` interface defines all available configuration options for creating a tunnel. Here are the available fields:

```ts
interface PinggyOptions {
  token?: string; // Optional authentication token for the tunnel
  serverAddress?: string; // Custom Pinggy server address
  sniServerName?: string; // SNI server name for TLS
  forwardTo?: string; // Local address to forward traffic to (e.g., "localhost:3000")
  debug?: boolean; // Enable debug logging for this tunnel
  debuggerPort?: number; // Port for web debugging
  type?: "tcp" | "tls" | "http" | "udp"; // Tunnel protocol type
  ipWhitelist?: string[]; // List of allowed client IPs
  basicAuth?: Record<string, string>; // Basic authentication users (username: password)
  bearerAuth?: string[]; // Bearer tokens for authentication
  headerModification?: HeaderModification[]; // Modify headers (add, remove, update)
  xff?: boolean; // Enable X-Forwarded-For header
  httpsOnly?: boolean; // Only allow HTTPS traffic
  fullRequestUrl?: boolean; // Provide full request URL to backend
  allowPreflight?: boolean; // Allow CORS preflight requests
  noReverseProxy?: boolean; // Disable reverse proxy behavior
  cmd?: string; // Optional command prefix
  ssl?: boolean; // Use SSL for tunnel setup
}

interface HeaderModification {
  key: string;
  value?: string;
  action: "add" | "remove" | "update";
}
```

**Descriptions:**

- `token`: Use this to authenticate your tunnel with a Pinggy token.
- `serverAddress`: Specify a custom Pinggy server if needed.
- `sniServerName`: For advanced TLS/SNI routing.
- `forwardTo`: The local address (host:port) to forward incoming traffic to.
- `debug`: Enable debug logging for this tunnel instance.
- `debuggerPort`: Port to use for web debugging.
- `type`: Choose the protocol for your tunnel (`tcp`, `tls`, `http`, or `udp`).
- `ipWhitelist`: Restrict access to specific client IPs.
- `basicAuth`: Provide a map of usernames to passwords for HTTP basic authentication.
- `bearerAuth`: List of bearer tokens for HTTP authentication.
- `headerModification`: Modify HTTP headers (add, remove, update) for incoming requests.
- `xff`: Enable the X-Forwarded-For header for client IP forwarding.
- `httpsOnly`: Only allow HTTPS connections to your tunnel.
- `fullRequestUrl`: Pass the full request URL to your backend.
- `allowPreflight`: Allow CORS preflight (OPTIONS) requests.
- `noReverseProxy`: Disable reverse proxy features if not needed.
- `cmd`: Optional command prefix for advanced use.
- `ssl`: Use SSL for tunnel setup and communication.

---

## Best Practices

- Always call `stop()` on tunnels you no longer need to free resources.
- Use `getStatus()` to monitor tunnel lifecycle.
- Use `pinggy.closeAllTunnels()` before application exit to ensure cleanup.
- Prefer `urls()` to get all available public addresses for your tunnel.
- Use `getServerAddress()` only if you need to know which Pinggy backend server your tunnel is connected to (for diagnostics or advanced use).

---

## Troubleshooting

- If you encounter errors, check your local server is running and accessible.
- For advanced debugging, enable logs in your application (see SDK source for details).
- **Enable Debug Logs:**
  To get detailed logs for troubleshooting, enable debug logging:
  ```ts
  pinggy.setDebugLogging(true);
  ```
  This will print detailed debug information to the console. To turn off debug logs, call:
  ```ts
  pinggy.setDebugLogging(false);
  ```
