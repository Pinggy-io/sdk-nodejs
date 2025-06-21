# Pinggy SDK User Guide

Welcome to the Pinggy SDK! This guide will help you get started with installation, creating tunnels, managing multiple tunnels, and using advanced features.

---

## Installation

Install the SDK via npm:

```bash
npm install pinggy
```

---

## Build From Source

> **Compatibility Note:**
>
> - The Pinggy SDK only works on:
>   - **Node.js 18 or newer** for **Linux x64**, **Linux arm64**, and **Windows x64**
>   - **Node.js 19 or newer** for **Windows arm64**
> - Other platforms and Node.js versions are not supported as of now.

### Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
- [git](https://git-scm.com/) for cloning the repository.

### Steps

1. **Clone the repository and checkout the latest code:**

   ```bash
   git clone https://github.com/your-org/pinggy.git
   cd pinggy
   git checkout master
   ```

2. **Install dependencies and build the package:**

   ```bash
   npm install
   npm run build
   npm pack
   ```

   This will generate a file like `pinggy-test-{version}.tgz` in your project directory.

3. **Test the package in a separate project:**

   - Create a new directory for your example/test project:
     ```bash
     mkdir ../pinggy-example
     cd ../pinggy-example
     npm init -y
     ```
   - Install the locally built package (use the correct relative or absolute path):
     ```bash
     npm install ../pinggy/pinggy-test-{version}.tgz
     ```

4. **Use the SDK in your example project:**
   - Create an `index.js` or `index.ts` and import/use the SDK as described in the Quick Start section.

### Notes

- You can now develop and test against your local build before publishing or using in production.

---

## Quick Start

### Import the SDK

```ts
import { pinggy } from "pinggy-test"; (to change to import { pinggy } from "@pinggy/pinggy"; upon release)
```

### Create and Start a Tunnel

```ts
const tunnel = pinggy.createTunnel({ forwardTo: "localhost:3000" });
await tunnel.start();
console.log("Tunnel URLs:", tunnel.urls()); // Get all public addresses
```

---

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

## Tunnel Management

- **Get all tunnels:**
  ```ts
  const allTunnels = pinggy.getAllTunnels();
  ```
- **Check tunnel status:**
  ```ts
  tunnel.getStatus(); // "starting" | "live" | "closed"
  ```
- **Check if tunnel is active:**
  ```ts
  tunnel.isActive(); // true or false
  ```
- **Get all public URLs for a tunnel:**
  ```ts
  const urls = tunnel.urls(); // array of public addresses
  console.log("Tunnel URLs:", urls);
  ```
- **Get the Pinggy server address (advanced):**
  ```ts
  const serverAddr = tunnel.getServerAddress(); // address of the Pinggy backend server
  console.log("Pinggy server address:", serverAddr);
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

### `pinggy`

- `createTunnel(options: PinggyOptions): TunnelInstance` — Create a new tunnel (does not start it).
- `forward(options: PinggyOptions): Promise<TunnelInstance>` — Create and start a tunnel, returns the instance when ready.
- `getAllTunnels(): TunnelInstance[]` — Get all active tunnel instances.
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

See the type definition for all available options (e.g., `forwardTo`, `token`, `serverAddress`, etc.).

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
