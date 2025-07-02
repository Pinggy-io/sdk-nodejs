import { pinggy, PinggyOptions, TunnelInstance } from "../index";
import * as http from "http";

/**
 * listen overloads:
 * - listen(app: Express, options?: PinggyOptions): Promise<http.Server & { tunnel: TunnelInstance }>
 * - listen(server: http.Server, options?: PinggyOptions): Promise<http.Server & { tunnel: TunnelInstance }>
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
    forwardTo: `localhost:${port}`,
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
