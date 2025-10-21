import { PinggyNative, TunnelStatus } from "./types";
import { PinggyOptions } from "./pinggyOptions";
import { Config } from "./bindings/config";
import { Tunnel } from "./bindings/tunnel";
import { Logger } from "./utils/logger";
import { getLastException, PinggyError, initExceptionHandling } from "./bindings/exception";
import { TunnelUsageType } from "./bindings/tunnel-usage";

/**
 * A lightweight worker-style abstraction that encapsulates all tunnel/config operations.
 *
 * This class centralizes initialization and method dispatch so that the outer TunnelInstance
 * can forward calls via a message-like API. This design allows future replacement with a real
 * Worker Thread without changing TunnelInstance public API.
 */
export class TunnelWorker {
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  private addon: PinggyNative;

  constructor(addon: PinggyNative, configRef: number, options: PinggyOptions) {
    this.addon = addon;
    initExceptionHandling(this.addon);

    // set debug logging to false initially
    this.addon.setLogEnable(false);

    try {
      this.tunnel = new Tunnel(this.addon, configRef, options);
    } catch (e) {
      if (e instanceof PinggyError) {
        Logger.error("Tunnel init error:", e);
        throw e;
      }
      const lastEx = getLastException(this.addon);
      const pinggyError = lastEx ? new PinggyError(lastEx) : new Error(String(e));
      Logger.error("Tunnel init error:", pinggyError);
      throw pinggyError;
    }
  }

  // Generic dispatcher map to keep maintenance simple when adding methods
  private methodMap: Record<string, (...args: any[]) => any> = {
    // Tunnel related
    start: async () => {
      if (!this.tunnel) throw new Error("Tunnel not initialized");
      return await this.tunnel.start();
    },
    urls: () => this.tunnel?.getUrls() ?? [],
    stop: () => {
      if (!this.tunnel) throw new Error("Tunnel not initialized");
      this.tunnel.tunnelStop();
      this.tunnel = null;
      this.config = null;
    },
    getGreetMessage: () => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      return this.tunnel.getTunnelGreetMessage();
    },
    startUsageUpdate: () => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      this.tunnel.startTunnelUsageUpdate();
    },
    stopUsageUpdate: () => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      this.tunnel.stopTunnelUsageUpdate();
    },
    getUsages: () => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      return this.tunnel.getTunnelUsages();
    },
    getLatestUsage: (): TunnelUsageType | null => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      return this.tunnel.getLatestUsage();
    },
    setUsageUpdateCallback: (callback: (usage: Record<string, any>) => void) => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      this.tunnel.setUsageUpdateCallback(callback);
    },
    setTunnelErrorCallback: (callback: (errorNo: number, error: string, recoverable: boolean) => void) => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      this.tunnel.setTunnelErrorCallback(callback);
    },
    setTunnelDisconnectedCallback: (callback: (error: string, messages: string[]) => void) => {
      if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
      this.tunnel.setTunnelDisconnectedCallback(callback);
    },
    isActive: (): boolean => {
      if (!this.tunnel) return false;
      return this.tunnel.tunnelIsActive();
    },
    getStatus: (): TunnelStatus => {
      return this.tunnel?.status ?? TunnelStatus.CLOSED;
    },
    startWebDebugging: (port: number) => {
      if (!this.tunnel) throw new Error("Tunnel not initialized");
      this.tunnel.startWebDebugging(port);
    },
    tunnelRequestAdditionalForwarding: async (hostname: string, target: string) => {
      if (!this.tunnel) throw new Error("Tunnel not initialized");
      await this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
    },
    getWebDebuggerPort: (): number => {
      return this.tunnel?.getWebDebuggerPort() ?? 0;
    },
  };

  /**
   * Generic message-style invoker. For maintainability, all TunnelInstance method
   * calls should be routed via this function with the method name.
   */
  public invoke<T = any>(method: string, ...args: any[]): T {
    const fn = this.methodMap[method];
    if (!fn) throw new Error(`Unknown method: ${method}`);
    return fn(...args);
  }
}
