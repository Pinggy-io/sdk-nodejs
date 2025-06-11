// core/pinggy.ts
import { PinggyNative, PinggyOptions } from "../types";
import { Config } from "../bindings/config";
import { Tunnel } from "../bindings/tunnel";
import { Logger } from "../utils/logger";

export class Pinggy {
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;

  /** 
   * Initialize the native bindings & Tunnel if not already done.
   * Called internally by startTunnel().
   */
  private initialize(options: PinggyOptions): void {
    if (this.tunnel) return; // already initialized

    try {
      const binary = require("@mapbox/node-pre-gyp");
      const path = require("path");
      const binding_path = binary.find(
        path.resolve(path.join(__dirname, "../../package.json"))
      );
      const addon = require(binding_path) as PinggyNative;

      this.config = new Config(addon, options);
      if (!this.config.configRef) {
        throw new Error("Failed to initialize config.");
      }
      this.tunnel = new Tunnel(addon, this.config.configRef);
    } catch (e) {
      Logger.error("Error initializing Pinggy:", e as Error);
      throw e;
    }
  }

  /**
   * Start the tunnel (and initialize if necessary).
   * Returns the public-facing addresses.
   */
  public async startTunnel(options: PinggyOptions): Promise<string[]> {
    this.initialize(options);
    if (!this.tunnel) throw new Error("Tunnel failed to initialize");
    try {
      return await this.tunnel.start();
    } catch (e) {
      Logger.error("Error starting tunnel:", e as Error);
      throw e;
    }
  }

  public startWebDebugging(port: number): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    try {
      this.tunnel.startWebDebugging(port);
    } catch (e) {
      Logger.error("Error starting web debugging:", e as Error);
      throw e;
    }
  }

  public tunnelRequestAdditionalForwarding(hostname: string, target: string): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    try {
      this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
    } catch (e) {
      Logger.error("Error requesting additional forwarding:", e as Error);
      throw e;
    }
  }

  public getServerAddress(): string | null {
    return this.config?.getServerAddress() ?? null;
  }

  public getSniServerName(): string | null {
    return this.config?.getSniServerName() ?? null;
  }

  public getToken(): string | null {
    return this.config?.getToken() ?? null;
  }

  /** 
   * Stops the tunnel and resets state so you can start a new one later.
   */
  public async close(): Promise<void> {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    try {
      this.tunnel.tunnelStop();
    } catch (e) {
      Logger.error("Error stopping tunnel:", e as Error);
      throw e;
    } finally {
      // clear state
      this.tunnel = null;
      this.config = null;
    }
  }
}
