import { PinggyNative, PinggyOptions } from "./types";
import { Config } from "./bindings/config";
import { Tunnel } from "./bindings/tunnel";
import { Logger } from "./utils/logger";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "./bindings/exception";

export class TunnelInstance {
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  private addon: PinggyNative;

  constructor(addon: PinggyNative, options: PinggyOptions) {
    this.addon = addon;
    initExceptionHandling(this.addon);
    // Disable logs
    this.addon.setLogEnable(false);
    try {
      this.config = new Config(this.addon, options);
      if (!this.config.configRef)
        throw new Error("Failed to initialize config.");
      this.tunnel = new Tunnel(this.addon, this.config.configRef);
    } catch (e) {
      const lastEx = getLastException(this.addon);
      const pinggyError = lastEx
        ? new PinggyError(lastEx)
        : new Error(String(e));
      Logger.error("Tunnel init error:", pinggyError);
      throw pinggyError;
    }
  }

  public async start(): Promise<string[]> {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    return await this.tunnel.start();
  }

  public urls(): string[] {
    return this.tunnel?.getUrls() ?? [];
  }

  public stop(): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    this.tunnel.tunnelStop();
    this.tunnel = null;
    this.config = null;
  }

  public isActive(): boolean {
    if (!this.tunnel) return false;
    return this.tunnel.tunnelIsActive();
  }

  public getStatus(): "starting" | "live" | "closed" {
    return this.tunnel?.status ?? "closed";
  }

  public getServerAddress(): string | null {
    return this.config?.getServerAddress() ?? null;
  }

  public getToken(): string | null {
    return this.config?.getToken() ?? null;
  }

  public startWebDebugging(port: number): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    this.tunnel.startWebDebugging(port);
  }
  public tunnelRequestAdditionalForwarding(
    hostname: string,
    target: string
  ): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
  }

  public getArgument(): string | null {
    return this.config?.getArgument() ?? null;
  }
}
