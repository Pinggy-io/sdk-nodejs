import { pinggy, PinggyOptions, TunnelInstance } from "../index.js";
import * as http from "http";

/**
 * Starts an HTTP server (or uses an existing one) and exposes it via a Pinggy tunnel.
 *
 * @group Functions
 * @public
 *
 * @remarks
 * This function provides a utility to expose an Express app or http.Server via a Pinggy tunnel.
 * It supports both Express applications and native Node.js http.Server instances.
 *
 * @param app - The Express app or http.Server to expose.
 * @param options - Optional tunnel configuration options.
 * @returns Promise that resolves with the HTTP server instance, with an added `tunnel` property of type {@link TunnelInstance}.
 * @throws Error if the input is not an Express app or http.Server, or if tunnel setup fails.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { listen } from '@pinggy/pinggy';
 *
 * const app = express();
 * app.get('/', (req, res) => res.send('Hello World!'));
 *
 * const server = await listen(app, { token: 'your-token' });
 * console.log('Tunnel URLs:', server.tunnel.urls());
 * ```
 */
export async function listen(
  app: http.Server | any,
  options?: PinggyOptions
): Promise<http.Server & { tunnel: TunnelInstance }> {
  let server: http.Server | undefined = undefined;
  let startedHere = false;

  // Helper: is http.Server
  function isHttpServer(obj: any): obj is http.Server {
    return (
      obj &&
      typeof obj === "object" &&
      typeof obj.listen === "function" &&
      typeof obj.address === "function"
    );
  }

  // Helper: is Express app (function with .listen)
  function isExpressApp(obj: any): boolean {
    return typeof obj === "function" && typeof obj.listen === "function";
  }

  if (!isHttpServer(app) && !isExpressApp(app)) {
    throw new Error(
      "listen() expects an Express app or http.Server as the first argument."
    );
  }

  // If Express app, start it
  if (isExpressApp(app)) {
    server = app.listen(0); // random port
    startedHere = true;
    await new Promise((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
  } else if (isHttpServer(app)) {
    server = app;
    // If not listening, start it
    if (!server.address()) {
      server.listen(0);
      startedHere = true;
      await new Promise((resolve, reject) => {
        server!.once("listening", resolve);
        server!.once("error", reject);
      });
    }
  }

  if (!server) {
    throw new Error("Server was not initialized.");
  }

  // Get the port
  const addr = server.address();
  if (!addr || typeof addr !== "object" || !addr.port) {
    if (startedHere) server.close();
    throw new Error("Could not determine server port after listen().");
  }
  const port = addr.port;

  // Merge options with detected port
  const tunnelOptions: PinggyOptions = {
    ...options,
    forwarding: `localhost:${port}`,
  };

  // Start the tunnel
  let tunnel: TunnelInstance;
  try {
    tunnel = await pinggy.forward(tunnelOptions);
  } catch (err) {
    if (startedHere) server.close();
    throw err;
  }

  // Attach tunnel to server
  (server as any).tunnel = tunnel;
  return server as http.Server & { tunnel: TunnelInstance };
}
