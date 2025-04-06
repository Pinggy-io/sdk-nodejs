import { PinggyNative, PinggyOptions } from "../types";
import { Config } from "../bindings/config";
import { Tunnel } from "../bindings/tunnel";
import { Logger } from "../utils/logger";

export class PinggySDK {
  private config: Config | null;
  private tunnel: Tunnel | null;

  constructor(options: PinggyOptions = {}) {
    this.config = null;
    this.tunnel = null;

    // Proceed with normal initialization
    this.initialize(options);
  }

  private initialize(options: PinggyOptions): void {
    try {
      const binary = require("@mapbox/node-pre-gyp");
      const path = require("path");
      const binding_path = binary.find(
        path.resolve(path.join(__dirname, "../../package.json"))
      );
      const addon = require(binding_path) as PinggyNative;
      // const addon = require("../../build/Release/addon.node") as PinggyNative;
      this.config = new Config(addon, options);
      if (!this.config.configRef) {
        throw new Error("Failed to initialize config.");
      }
      this.tunnel = new Tunnel(addon, this.config.configRef);
    } catch (e) {
      Logger.error("Error initializing PinggySDK:", e as Error);
    }
  }

  public startTunnel(): void {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.start();
    } catch (e) {
      Logger.error("Error starting tunnel:", e as Error);
    }
  }

  public startWebDebugging(listeningPort: number): void {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.startWebDebugging(listeningPort);
    } catch (e) {
      Logger.error("Error starting web debugging:", e as Error);
    }
  }

  public tunnelRequestAdditionalForwarding(
    hostname: string,
    target: string
  ): void {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
    } catch (e) {
      Logger.error("Error requesting additional forwarding:", e as Error);
    }
  }

  public getServerAddress(): string | null {
    return this.config?.getServerAddress() || null;
  }

  public getSniServerName(): string | null {
    return this.config?.getSniServerName() || null;
  }

  public getToken(): string | null {
    return this.config?.getToken() || null;
  }
}
