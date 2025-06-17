import { quote } from "shell-quote";

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
      const serverAddress = options.serverAddress || "t.pinggy.io:443";
      const sniServerName = options.sniServerName || "t.pinggy.io";
      const forwardTo = options.forwardTo || "localhost:4000";
      const type = options.type || ""; // Default to empty string if not provided
      const ssl = options.ssl !== undefined ? options.ssl : true; // Default to true if not specified

      this.prepareAndSetArgument(configRef, options);

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
            Logger.error(
              "Error setting SNI server name:",
              new Error(String(e))
            );
          }
          throw e;
        }
      }

      // Set SSL configuration
      try {
        this.addon.configSetSsl(configRef, ssl);
        Logger.info(`SSL configuration set to: ${ssl}`);
      } catch (e) {
        const lastEx = this.addon.getLastException();
        if (lastEx) {
          const pinggyError = new PinggyError(lastEx);
          Logger.error("Error setting SSL configuration:", pinggyError);
          throw pinggyError;
        } else {
          if (e instanceof Error) {
            Logger.error("Error setting SSL configuration:", e);
          } else {
            Logger.error(
              "Error setting SSL configuration:",
              new Error(String(e))
            );
          }
          throw e;
        }
      }

      if (type === "udp") {
        try {
          this.addon.configSetUdpForwardTo(configRef, forwardTo);
          Logger.info(`Configured UDP forwarding to: ${forwardTo}`);
        } catch (e) {
          const lastEx = this.addon.getLastException();
          if (lastEx) {
            const pinggyError = new PinggyError(lastEx);
            Logger.error("Error setting UDP forward to:", pinggyError);
            throw pinggyError;
          } else {
            if (e instanceof Error) {
              Logger.error("Error setting UDP forward to:", e);
            } else {
              Logger.error(
                "Error setting UDP forward to:",
                new Error(String(e))
              );
            }
            throw e;
          }
        }
      } else {
        this.addon.configSetTcpForwardTo(configRef, forwardTo);
      }

      if (type) {
        try {
          if (type === "udp") {
            this.addon.configSetUdpType(configRef, type);
          } else {
            this.addon.configSetType(configRef, type);
          }
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

  private prepareAndSetArgument(configRef: number, options: PinggyOptions) {
    const val: string[] = [];

    if (options.ipWhitelist?.length) {
      val.push(`w:${options.ipWhitelist.join(",")}`);
    }

    if (options.basicAuth && Object.keys(options.basicAuth).length > 0) {
      for (const [user, pass] of Object.entries(options.basicAuth)) {
        val.push(`b:${user}:${pass}`);
      }
    }

    if (options.bearerAuth?.length) {
      for (const token of options.bearerAuth) {
        val.push(`k:${token}`);
      }
    }

    if (options.headerModification?.length) {
      for (const header of options.headerModification) {
        switch (header.action) {
          case "add":
            if (header.key && header.value) {
              val.push(`a:${header.key}:${header.value}`);
            } else {
              Logger.error(
                `Invalid add header: missing key or value for ${JSON.stringify(
                  header
                )}`
              );
            }
            break;
          case "remove":
            if (header.key) {
              val.push(`r:${header.key}`);
            } else {
              Logger.error(
                `Invalid remove header: missing key for ${JSON.stringify(
                  header
                )}`
              );
            }
            break;
          case "update":
            if (header.key && header.value) {
              val.push(`u:${header.key}:${header.value}`);
            } else {
              Logger.error(
                `Invalid update header: missing key or value for ${JSON.stringify(
                  header
                )}`
              );
            }
            break;
          default:
            Logger.error(
              `Unknown header action: ${header.action} for ${JSON.stringify(
                header
              )}`
            );
        }
      }
    }

    if (options.xff) val.push("x:xff");
    if (options.httpsOnly) val.push("x:https");
    if (options.fullRequestUrl) val.push("x:fullurl");
    if (options.allowPreflight) val.push("x:passpreflight");
    if (options.noReverseProxy) val.push("x:noreverseproxy");

    let argument = quote(val);
    if (options.cmd && options.cmd.trim()) {
      argument = `${options.cmd.trim()} ${argument}`;
    }

    Logger.info(`Setting config argument: ${argument}`);

    this.addon.configSetArgument(configRef, argument);
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
