# Pinggy SDK - TypeScript Example

This example demonstrates how to use the Pinggy SDK in a Node.js TypeScript project with full type safety.

## Installation

```bash
npm install @pinggy/pinggy
```

## Setup

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Building and Running

```bash
# Build TypeScript
npm run build

# Run the example
npm start
```

## Basic Usage

### Simple Tunnel Creation

```typescript
import { pinggy } from "@pinggy/pinggy";

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

### Multiple Tunnels with Type Safety

```typescript
import { pinggy, PinggyOptions, TunnelInstance } from "@pinggy/pinggy";

(async () => {
  // Create multiple tunnels with typed options
  const options1: PinggyOptions = { forwardTo: "localhost:3000" };
  const options2: PinggyOptions = { forwardTo: "localhost:4000" };

  const tunnel1: TunnelInstance = pinggy.createTunnel(options1);
  const tunnel2: TunnelInstance = pinggy.createTunnel(options2);

  await tunnel1.start();
  await tunnel2.start();

  console.log("Tunnel 1 URLs:", await tunnel1.urls());
  console.log("Tunnel 2 URLs:", await tunnel2.urls());

  // Get all active tunnels with type safety
  const allTunnels: TunnelInstance[] = pinggy.getAllTunnels();
  console.log("Total tunnels:", allTunnels.length);

  // Close all tunnels
  setTimeout(() => {
    pinggy.closeAllTunnels();
  }, 10000);
})();
```




## API Reference

### `TunnelInstance` Methods
To learn more about the methods available on `TunnelInstance` objects—used for managing the lifecycle of tunnels and performing common operations such as creating, closing, and handling tunnel events—please visit the [documentation](https://pinggy-io.github.io/sdk-nodejs/classes/TunnelInstance.html)


## Troubleshooting

- Ensure TypeScript compiler is configured correctly
- Check that all imports are properly typed
- Use `@types/node` for Node.js types
- Enable strict mode for better error catching
- Use TypeScript's built-in error checking during development
