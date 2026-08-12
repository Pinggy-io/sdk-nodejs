# Pinggy Node.js SDK

`@pinggy/pinggy` is the official Node.js SDK for [Pinggy](http://pinggy.io/)

This guide will help you get started with installation, creating tunnels, managing multiple tunnels, and using advanced features.

## Installation

Install the SDK via npm:

```bash
npm install @pinggy/pinggy
```

> **Compatibility Note:**
>
> - The Pinggy SDK only works on:
>   - **Node.js 18 or newer** for **Linux x64 and arm 64**, **Mac OS x64 and arm64**, and **Windows x64**
>   - **Node.js 19 or newer** for **Windows arm64**
> - Other platforms and Node.js versions are not supported as of now.

## Quick Start

```ts
import { pinggy } from "@pinggy/pinggy";


const tunnel = await pinggy.createTunnel({ forwarding: "localhost:3000" });
await tunnel.start();
console.log("Tunnel URLs:", await tunnel.urls()); // Get all public addresses
```

Or use the convenient `forward` method:

```ts
const tunnel = await pinggy.forward({ forwarding: "localhost:5000" });
console.log("Tunnel URLs:", await tunnel.urls());
```

**Authorization:** Create persistent tunnels with your own domains using tokens obtained from [dashboard.pinggy.io](https://dashboard.pinggy.io).

```ts
const tunnel = await pinggy.forward({ forwarding: "localhost:5000", token: "YOUR_TOKEN" });
console.log("Tunnel URLs:", await tunnel.urls());
```

Find complete examples at [examples](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples).

## Managing Multiple Tunnels

You can create and manage multiple tunnels simultaneously:

```ts
const tunnel1 = await pinggy.createTunnel({ forwarding: "localhost:3000" });
const tunnel2 = await pinggy.createTunnel({ forwarding: "localhost:4000" });
await tunnel1.start();
await tunnel2.start();
console.log("Tunnel 1 URLs:", await tunnel1.urls());
console.log("Tunnel 2 URLs:", await tunnel2.urls());
```

## TCP / UDP / TLS / TLSTCP tunnels

Pinggy supports `tcp`, `udp`, `tls`, and `tlstcp` tunnels for exposing non-HTTP services (e.g. SSH, a database, a game server, or any raw socket server). The examples below use TCP; the same patterns apply to `udp`, `tls`, and `tlstcp` - just swap the prefix in the string form or the `TunnelType` value in the structured form.

> **Note:** `tlstcp` is only available to Pro plan users.

You can use the simple string form with a `tcp://` prefix:

```ts
import { pinggy } from "@pinggy/pinggy";

// Simple string form - the "tcp://" prefix selects a TCP tunnel
const tunnel = await pinggy.forward({ forwarding: "tcp://localhost:22" });
console.log("TCP Tunnel URLs:", await tunnel.urls());
```

Or the structured form with an explicit `TunnelType`:

```ts
import { pinggy, TunnelType } from "@pinggy/pinggy";

const tunnel = await pinggy.forward({
  forwarding: [{ address: "localhost:8001", type: TunnelType.Tcp }],
});
console.log("TCP Tunnel URLs:", await tunnel.urls());
```

To create a UDP, TLS, or TLSTCP tunnel, replace `tcp://` with `udp://`, `tls://`, or `tlstcp://` in the string form, or use `TunnelType.Udp`, `TunnelType.Tls`, or `TunnelType.TlsTcp` in the structured form. `TunnelType.Http` is also supported for explicit HTTP tunnels.

## Multiple Forwardings on a Single Tunnel

A single tunnel can route different remote bindings to different local services. Pass `forwarding` as an array of `ForwardingEntry` objects - the first entry without a `listenAddress` is treated as the primary forwarding, and the rest are registered as additional forwardings:

```ts

import { pinggy, TunnelType } from "@pinggy/pinggy";

const tunnel = await pinggy.forward({
  forwarding: [
    // Primary forwarding (no listenAddress): the server assigns a public URL
     { 
      address: "localhost:3000"
      type: TunnelType.Http
     },

    // Additional forwarding bound to a specific remote address
    {
      listenAddress: "app.example.com",
      address: "http://localhost:4000",
      type: TunnelType.Http,
    },
  ],
});

console.log("Tunnel URLs:", await tunnel.urls());
```

You can also register additional forwardings dynamically after the tunnel has started - see [`tunnelRequestAdditionalForwarding`](#advanced-features). The domain can be configured from [https://dashboard.pinggy.io/domains](https://dashboard.pinggy.io/domains). To know more visit [docs](https://pinggy.io/docs/http_tunnels/multi_port_forwarding).

---

## Examples

[Degit](https://www.npmjs.com/package/degit) can be used for cloning and running an example directory for the following available examples:

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
  node index.js
  ```
- **[TypeScript](https://github.com/Pinggy-io/sdk-nodejs/tree/master/examples/ts)** - TypeScript examples with full type safety

  ```bash
  npx degit github:Pinggy-io/sdk-nodejs/examples/ts ts-example
  cd ts-example && npm i
  npm run start
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
  const urls = await tunnel.urls(); // array of public addresses
  console.log("Tunnel URLs:", urls);
  ```
- **Check tunnel status:**
  ```ts
  await tunnel.getStatus(); // "starting" | "live" | "closed"
  ```
- **Check tunnel stats:**
  ```ts
  await tunnel.getLatestUsage(); // {"elapsedTime":7,"numLiveConnections":6,"numTotalConnections":6,"numTotalReqBytes":16075,"numTotalResBytes":815760,"numTotalTxBytes":831835}
  ```
- **Check if tunnel is active:**
  ```ts
  await tunnel.isActive(); // true or false
  ```
- **Stop a tunnel:**
  ```ts
  await tunnel.stop();
  ```
- **Close all tunnels:**
  ```ts
  await pinggy.closeAllTunnels();
  ```

---

## Advanced Features

- **Start web debugger:**
  ```ts
  tunnel.startWebDebugging('localhost:4300'); // Starts web debugger on the given local listening address
  ```
- **Request additional forwarding:** If you have multiple domains, you can route different domains to different ports as follows:
  ```ts
  await tunnel.tunnelRequestAdditionalForwarding(
    "mydomain.com:443",
    "localhost:6000",
    "http" // optional: "http" | "tcp" | "tls" | "tlstcp" | "udp"
  );
  ```

---

## API Reference

### Imports

```ts
import {
  pinggy,
  TunnelInstance,
  type TunnelConfigurationV1,
  listen,
  TunnelType,
  HaProxyVersion
} from "@pinggy/pinggy";
```

### `pinggy`

- `createTunnel(options: PinggyOptions): TunnelInstance` - Create a new tunnel (does not start it).
- `forward(options: PinggyOptions): Promise<TunnelInstance>` - Create and start a tunnel, returns the instance when ready.
- `closeAllTunnels(): void` - Stop and remove all tunnels.

### `TunnelInstance`

- `start(): Promise<string[]>` - Start the tunnel.
- `stop(): void` - Stop the tunnel and clean up resources.
- `isActive(): boolean` - Check if the tunnel is active.
- `getStatus(): "starting" | "live" | "closed"` - Get the tunnel's current status.
- `urls(): string[]` - **Get the array of public addresses returned by the tunnel's primary forwarding callback.**
- `getServerAddress(): string | null` - **Get the address of the Pinggy backend server this tunnel is connected to.**
- `getToken(): string | null` - Get the tunnel token.
- `startWebDebugging(port: number): void` - Start web debugging on a local port.
- `tunnelRequestAdditionalForwarding(hostname: string, target: string): void` - Request additional forwarding.
- `getConfig(): PinggyOptions | null`  
  Return the tunnel's current runtime configuration object `PinggyOptions`. Returns `null` if no config is loaded.
- `getGreetMessage(): string`  
  Return a short human-readable greeting. Always returns a string.
- `setUsageUpdateCallback(cb: (usage: Record<string, any>) => void): void`  
  Register a callback that will be invoked when the SDK receives usage updates from the backend or tunnel process.

  Example:

  ```ts
  tunnel.setUsageUpdateCallback((usage) => {
    console.log("Usage update:", usage);
  });

  ```
- `getLatestUsage(): Promise<TunnelUsageType | null>`
  Return the most recently received usage snapshot, or `null` if no usage data has been received yet.

### `TunnelConfigurationV1`

The `TunnelConfigurationV1` interface defines all available configuration options for creating a tunnel. Here are the available fields:

```ts
interface TunnelConfigurationV1 {
  token?: string; // Optional authentication token for the tunnel
  serverAddress?: string; // Custom Pinggy server address
  forwarding?: string | ForwardingEntry; // Local address to forward traffic to (e.g., "localhost:3000")
  webDebugger?: string; // Local address for web debugger.(e,g "localhost:8080")
  ipWhitelist?: string[]; // List of allowed client IPs
  basicAuth?: { username: string; password: string }[];; // Basic authentication users { "admin": "secret123", "user": "password" }
  bearerTokenAuth?: string[]; // Bearer tokens for authentication
  headerModification?: HeaderModification[]; // Modify headers (add, remove, update)
  xForwardedFor?: boolean; // Enable X-Forwarded-For header
  httpsOnly?: boolean; // Only allow HTTPS traffic
  originalRequestUrl?: boolean; // Provide full request URL to backend
  allowPreflight?: boolean; // Allow CORS preflight requests
  reverseProxy?: boolean; // Disable reverse proxy behavior
  haProxy?: HaProxyVersion; // Enable HAProxy PROXY protocol header
  force?: boolean; // Force specific tunnel settings or bypass certain restrictions.
  autoReconnect?: boolean; // Auto-reconnect configuration for the tunnel.
  reconnectInterval?:number; // Time interval (in seconds) between reconnection attempts.(default: 5)
  maxReconnectAttempts?:number; // Maximum number of reconnection attempts before giving up.(default: 20)
  optional?: Optional; // Optional command prefix
  
}

interface HeaderModification {
  key: string;
  value?: string[];
  type: "add" | "remove" | "update";
}

interface ForwardingEntry {
  address: string;        // e.g., http://localhost:80 or host:port 
  type?: TunnelType;     // Optional tunnel type, default is inferred from address
  listenAddress?: string; // empty or undefined means default forwarding
}

const enum TunnelType {
  Http = "http",
  Tcp = "tcp",
  Tls = "tls",
  Udp = "udp",
  TlsTcp = "tlstcp",
}

const enum HaProxyVersion {
  V1 = "v1",
  V2 = "v2",
}

interface Optional {
  sniServerName?: string; // SNI server name for SSL/TLS.
  ssl?: boolean; //  Whether to use SSL for tunnel setup. (default: false)
  additionalArguments?: string; // Optional command prefix for the tunnel.(e,g "--tcp)
}
```

**Descriptions:**

- `token`: Use this to authenticate your tunnel with a Pinggy token.
- `serverAddress`: Specify a custom Pinggy server if needed.
- `forwarding`: The local address (host:port) to forward incoming traffic to.
- `webDebugger`: Local address use for web debugging for this tunnel instance.
- `ipWhitelist`: Restrict access to specific client IPs.
- `basicAuth`: An array of objects, where each object has a username (string) and password (string)..
- `bearerTokenAuth`: List of bearer tokens for HTTP authentication.
- `headerModification`: Modify HTTP headers (add, remove, update) for incoming requests.
- `xForwardedFor`: Enable the X-Forwarded-For header for client IP forwarding.
- `httpsOnly`: Only allow HTTPS connections to your tunnel.
- `originalRequestUrl`: Pass the full request URL to your backend.
- `allowPreflight`: Allow CORS preflight (OPTIONS) requests.
- `reverseProxy`: Disable reverse proxy features if not needed.
- `haProxy`: Enable the HAProxy PROXY protocol header so your local server can recover the original client address. Set to `HaProxyVersion.V1` or `HaProxyVersion.V2` to choose the PROXY protocol version.
- `force`: Force specific tunnel settings or bypass certain server-side restrictions.
- `autoReconnect`: Automatically try to reconnect the tunnel if the connection drops. Set to `true` to enable automatic reconnection.
- `reconnectInterval`: Time in seconds between automatic reconnection attempts (default: 5). Increase to reduce retry frequency.
- `maxReconnectAttempts`: Maximum number of reconnection attempts before the tunnel gives up (default: 20).
- `optional`: Miscellaneous optional parameters for advanced setups:
  - `sniServerName`: Override the SNI server name used during TLS handshakes.
  - `ssl`: Whether to use SSL for tunnel setup (default: `false`).
  - `additionalArguments`: Extra command-line style arguments or flags to pass to the underlying tunnel process (e.g., `"--tcp`).

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
