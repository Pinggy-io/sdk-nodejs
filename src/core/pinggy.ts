// core/pinggy.ts
import { PinggyNative, PinggyOptions } from "../types";
import { Config } from "../bindings/config";
import { Tunnel } from "../bindings/tunnel";
import { Logger } from "../utils/logger";
import { getLastException, PinggyError, initExceptionHandling } from "../bindings/exception";

export class Pinggy {
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  public addon: PinggyNative;

  constructor() {
    const binary = require("@mapbox/node-pre-gyp");
    const path = require("path");
    const binding_path = binary.find(
      path.resolve(path.join(__dirname, "../../package.json"))
    );
    this.addon = require(binding_path) as PinggyNative;
    initExceptionHandling(this.addon);
  }

  /** 
   * Initialize the native bindings & Tunnel if not already done.
   * Called internally by startTunnel().
   */
  private initialize(options: PinggyOptions): void {
    if (this.tunnel) return; // already initialized

    try {
      this.config = new Config(this.addon, options);
      if (!this.config.configRef) {
        throw new Error("Failed to initialize config.");
      }
      this.tunnel = new Tunnel(this.addon, this.config.configRef);
    } catch (e) {
      const lastEx = getLastException(this.addon);
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error initializing Pinggy:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error initializing Pinggy:", e);
        } else {
          Logger.error("Error initializing Pinggy:", new Error(String(e)));
        }
        throw e;
      }
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
      const lastEx = getLastException(this.addon);
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error starting tunnel:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error starting tunnel:", e);
        } else {
          Logger.error("Error starting tunnel:", new Error(String(e)));
        }
        throw e;
      }
    }
  }

  public startWebDebugging(port: number): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    try {
      this.tunnel.startWebDebugging(port);
    } catch (e) {
      const lastEx = getLastException(this.addon);
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error starting web debugging:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error starting web debugging:", e);
        } else {
          Logger.error("Error starting web debugging:", new Error(String(e)));
        }
        throw e;
      }
    }
  }

  public tunnelRequestAdditionalForwarding(hostname: string, target: string): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    try {
      this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
    } catch (e) {
      const lastEx = getLastException(this.addon);
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error requesting additional forwarding:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error requesting additional forwarding:", e);
        } else {
          Logger.error("Error requesting additional forwarding:", new Error(String(e)));
        }
        throw e;
      }
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
   * Checks if the tunnel is currently active.
   */
  public isActive(): boolean {
    if (!this.tunnel) {
      Logger.info("Tunnel is not initialized, so it's not active.");
      return false;
    }
    try {
      const active = this.tunnel.tunnelIsActive();
      Logger.info(`Tunnel active status: ${active}`);
      return active;
    } catch (e) {
      const lastEx = getLastException(this.addon);
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error checking tunnel active status:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error checking tunnel active status:", e);
        } else {
          Logger.error("Error checking tunnel active status:", new Error(String(e)));
        }
        throw e;
      }
    }
  }

  /** 
   * Stops the tunnel and resets state so you can start a new one later.
   */
  public async close(): Promise<void> {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    try {
      this.tunnel.tunnelStop();
    } catch (e) {
      const lastEx = getLastException(this.addon);
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error stopping tunnel:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error stopping tunnel:", e);
        } else {
          Logger.error("Error stopping tunnel:", new Error(String(e)));
        }
        throw e;
      }
    } finally {
      // clear state
      this.tunnel = null;
      this.config = null;
    }
  }
}
