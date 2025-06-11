import { Logger } from "../utils/logger";
import { PinggyNative, PinggyOptions, Config as IConfig } from "../types";
import { PinggyError } from "./exception";

export class Config implements IConfig {
  public configRef: number;
  private addon: PinggyNative;

  constructor(addon: PinggyNative, options: PinggyOptions = {}) {
    this.addon = addon;
    this.configRef = this.initialize(options);
  }

  private initialize(options: PinggyOptions): number {
    try {
      const configRef = this.addon.createConfig();
      Logger.info(`Created config with reference: ${configRef}`);

      if (options.token) {
        try {
          this.addon.configSetToken(configRef, options.token);
          Logger.info("Token set successfully");
        } catch (e) {
          Logger.error("Error setting token:", e as Error);
        }
      }

      // Apply user-defined values or set defaults
      const serverAddress = options.serverAddress || "a.pinggy.io:443";
      const sniServerName = options.sniServerName || "a.pinggy.io";
      const forwardTo = options.forwardTo || "localhost:4000";
      const type = options.type || ""; // Default to empty string if not provided

      this.addon.configSetServerAddress(configRef, serverAddress);

      try {
        this.addon.configSetSniServerName(configRef, sniServerName);
      } catch (e) {
        const lastEx = this.addon.getLastException();
        if (lastEx) {
          const pinggyError = new PinggyError(lastEx);
          Logger.error("Error setting SNI server name:", pinggyError);
          throw pinggyError;
        } else {
          if (e instanceof Error) {
            Logger.error("Error setting SNI server name:", e);
          } else {
            Logger.error("Error setting SNI server name:", new Error(String(e)));
          }
          throw e;
        }
      }

      this.addon.configSetTcpForwardTo(configRef, forwardTo);

      if (type) {
        try {
          this.addon.configSetType(configRef, type);
          Logger.info(`Configured tunnel type: ${type}`);
        } catch (e) {
          const lastEx = this.addon.getLastException();
          if (lastEx) {
            const pinggyError = new PinggyError(lastEx);
            Logger.error("Error setting type:", pinggyError);
            throw pinggyError;
          } else {
            if (e instanceof Error) {
              Logger.error("Error setting type:", e);
            } else {
              Logger.error("Error setting type:", new Error(String(e)));
            }
            throw e;
          }
        }
      }

      // Set log path
      this.addon.setLogPath("./logs.log");

      Logger.info("Configurations applied successfully.");
      return configRef;
    } catch (e) {
      Logger.error("Error creating configuration:", e as Error);
      return 0;
    }
  }

  public setToken(token: string): void {
    try {
      if (this.configRef) this.addon.configSetToken(this.configRef, token);
    } catch (e) {
      Logger.error("Error setting token:", e as Error);
    }
  }

  public setServerAddress(address: string = "a.pinggy.io:443"): void {
    try {
      if (this.configRef)
        this.addon.configSetServerAddress(this.configRef, address);
    } catch (e) {
      Logger.error("Error setting server address:", e as Error);
    }
  }

  public getServerAddress(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetServerAddress(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting server address:", e as Error);
      return null;
    }
  }

  public getSniServerName(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetSniServerName(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting SNI server name:", e as Error);
      return null;
    }
  }

  public getToken(): string | null {
    try {
      return this.configRef ? this.addon.configGetToken(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting token:", e as Error);
      return null;
    }
  }
}
