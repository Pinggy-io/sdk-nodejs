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
  console.log("Tunnel URLs:", tunnel.urls());

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

  console.log("Tunnel 1 URLs:", tunnel1.urls());
  console.log("Tunnel 2 URLs:", tunnel2.urls());

  // Get all active tunnels with type safety
  const allTunnels: TunnelInstance[] = pinggy.getAllTunnels();
  console.log("Total tunnels:", allTunnels.length);

  // Close all tunnels
  setTimeout(() => {
    pinggy.closeAllTunnels();
  }, 10000);
})();
```

## TypeScript Types

### Main Interfaces

```typescript
interface PinggyOptions {
  forwardTo?: string;
  token?: string;
  serverAddress?: string;
  sniServerName?: string;
  type?: "http" | "tcp" | "udp";
  ssl?: boolean;
  httpsOnly?: boolean;
  autoReconnect?: boolean;
  fullRequestUrl?: boolean;
  allowPreflight?: boolean;
  noReverseProxy?: boolean;
  xff?: boolean;
  ipWhitelist?: string[];
  basicAuth?: Record<string, string>;
  bearerAuth?: string[];
  headerModification?: HeaderModification[];
  cmd?: string;
}

interface HeaderModification {
  action: "add" | "remove" | "update";
  key: string;
  value?: string;
}

interface TunnelInstance {
  start(): Promise<string[]>;
  stop(): void;
  urls(): string[];
  isActive(): boolean;
  getStatus(): "starting" | "live" | "closed";
  getServerAddress(): string | null;
  getToken(): string | null;
  startWebDebugging(port: number): void;
  startUsageUpdate(): Promise<void>;
  stopUsageUpdate(): Promise<void>;
  tunnelRequestAdditionalForwarding(hostname: string, target: string): void;
}
```

## Configuration Options

### Basic Options

| Option          | Type                       | Default             | Description                               |
| --------------- | -------------------------- | ------------------- | ----------------------------------------- |
| `forwardTo`     | `string`                   | `"localhost:4000"`  | Local address to forward traffic to       |
| `token`         | `string`                   | -                   | Authentication token for premium features |
| `serverAddress` | `string`                   | `"a.pinggy.io:443"` | Pinggy server address                     |
| `sniServerName` | `string`                   | `"a.pinggy.io"`     | SNI server name for SSL                   |
| `type`          | `"http" \| "tcp" \| "udp"` | `"http"`            | Tunnel type with type safety              |
| `ssl`           | `boolean`                  | `true`              | Enable/disable SSL                        |
| `autoReconnect` | `boolean`                  | `false`             | Enable auto-reconnection on disconnect    |

### Security Options

| Option        | Type                     | Description                                            |
| ------------- | ------------------------ | ------------------------------------------------------ |
| `ipWhitelist` | `string[]`               | List of allowed IP addresses                           |
| `basicAuth`   | `Record<string, string>` | Basic HTTP authentication with username/password pairs |
| `bearerAuth`  | `string[]`               | Bearer token authentication                            |

### HTTP Options

| Option           | Type      | Default | Description                   |
| ---------------- | --------- | ------- | ----------------------------- |
| `httpsOnly`      | `boolean` | `false` | Force HTTPS only              |
| `fullRequestUrl` | `boolean` | `false` | Include full URL in requests  |
| `allowPreflight` | `boolean` | `false` | Allow preflight CORS requests |
| `noReverseProxy` | `boolean` | `false` | Disable reverse proxy         |
| `xff`            | `boolean` | `false` | Add X-Forwarded-For header    |

### Header Modification (Typed)

```typescript
interface HeaderModification {
  action: "add" | "remove" | "update"; // Strongly typed actions
  key: string;
  value?: string; // Optional for "remove" action
}

// Usage
const options: PinggyOptions = {
  headerModification: [
    { action: "add", key: "X-Custom-Header", value: "custom-value" },
    { action: "remove", key: "X-Unwanted" },
    { action: "update", key: "X-Updated", value: "new-value" },
  ],
};
```

### Command Options

| Option | Type     | Description                            |
| ------ | -------- | -------------------------------------- |
| `cmd`  | `string` | Custom command to prepend to arguments |

## Complete TypeScript Example

```typescript
import { pinggy, PinggyOptions, TunnelInstance } from "@pinggy/pinggy";

(async () => {
  // Fully typed configuration
  const options: PinggyOptions = {
    forwardTo: "localhost:3000",
    token: "your-premium-token",
    type: "http", // TypeScript will ensure this is a valid type
    ssl: true,
    autoReconnect: true,
    httpsOnly: true,
    xff: true,
    ipWhitelist: ["192.168.1.0/24", "10.0.0.1"],
    basicAuth: {
      admin: "password123",
      user: "userpass",
    },
    bearerAuth: ["bearer-token-1", "bearer-token-2"],
    headerModification: [
      { action: "add", key: "X-Custom", value: "myapp" },
      { action: "remove", key: "X-Unwanted" },
      { action: "update", key: "X-Version", value: "1.0.0" },
    ],
  };

  try {
    const tunnel: TunnelInstance = await pinggy.forward(options);

    // Type-safe method calls
    const urls: string[] = tunnel.urls();
    const status: "starting" | "live" | "closed" = tunnel.getStatus();

    console.log("Tunnel URLs:", urls);
    console.log("Server Address:", serverAddress);
    console.log("Status:", status);

    // Start web debugging interface
    tunnel.startWebDebugging(8080);
    console.log("Web debugging available at: http://localhost:8080");

    // Request additional forwarding
    tunnel.tunnelRequestAdditionalForwarding(
      "custom.pinggy.io:443",
      "localhost:6000"
    );

    // Monitor tunnel status with type safety
    const monitorInterval = setInterval(() => {
      const isActive: boolean = tunnel.isActive();
      const currentStatus: "starting" | "live" | "closed" = tunnel.getStatus();

      console.log("Tunnel active:", isActive);
      console.log("Tunnel status:", currentStatus);

      if (!isActive) {
        clearInterval(monitorInterval);
      }
    }, 5000);

    // Graceful shutdown after 30 seconds
    setTimeout(() => {
      console.log("Shutting down tunnel...");
      tunnel.stop();
      console.log("Tunnel stopped.");
      clearInterval(monitorInterval);
    }, 30000);
  } catch (error: unknown) {
    // Type-safe error handling
    if (error instanceof Error) {
      console.error("Failed to start tunnel:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
})();
```

## API Reference

### Main API

```typescript
// Create a tunnel instance (not started)
function createTunnel(options?: PinggyOptions): TunnelInstance;

// Create and start a tunnel
function forward(options?: PinggyOptions): Promise<TunnelInstance>;

// Get all active tunnels
function getAllTunnels(): TunnelInstance[];

// Stop all active tunnels
function closeAllTunnels(): void;
```

### TunnelInstance Methods

```typescript
interface TunnelInstance {
  // Start the tunnel, returns public URLs when ready
  start(): Promise<string[]>;

  // Stop the tunnel and clean up resources
  stop(): void;

  // Get current public URLs
  urls(): string[];

  // Check if tunnel is currently active
  isActive(): boolean;

  // Get tunnel status with type safety
  getStatus(): "starting" | "live" | "closed";

  // Get Pinggy server address
  getServerAddress(): string | null;

  // Get tunnel authentication token
  getToken(): string | null;

  // Start web debugging interface on specified port
  startWebDebugging(port: number): void;

  // Request additional forwarding configuration
  tunnelRequestAdditionalForwarding(hostname: string, target: string): void;
}
```

## Troubleshooting

- Ensure TypeScript compiler is configured correctly
- Check that all imports are properly typed
- Use `@types/node` for Node.js types
- Enable strict mode for better error catching
- Use TypeScript's built-in error checking during development
