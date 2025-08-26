import { join } from "shlex";

import { Logger } from "../utils/logger";
import { PinggyNative, PinggyOptions, Config as IConfig } from "../types";
import { PinggyError } from "./exception";

/**
 * Represents the configuration for a Pinggy tunnel.
 * Handles setting up and managing tunnel options and arguments for the native addon.
 *
 * @group Classes
 * @public
 */
export class Config implements IConfig {
  /** Reference to the native config object. */
  public configRef: number;
  /** Native addon instance. */
  private addon: PinggyNative;

  /**
   * Creates a new Config instance and initializes it with the provided options.
   * @param addon - The native addon instance.
   * @param {PinggyOptions} [options={}] - The tunnel configuration options.
   */
  constructor(addon: PinggyNative, options: PinggyOptions = {}) {
    this.addon = addon;
    this.configRef = this.initialize(options);
  }

  /**
   * Initializes the configuration in the native addon and applies all options.
   * @private
   * @param {PinggyOptions} options - The tunnel configuration options.
   * @returns {number} The reference to the native config object.
   */
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

      // Set auto-reconnect configuration if provided
      if (options.autoReconnect !== undefined) {
        try {
          this.addon.configSetAutoReconnect(configRef, options.autoReconnect);
          Logger.info(
            `Auto-reconnect configuration set to: ${options.autoReconnect}`
          );
        } catch (e) {
          const lastEx = this.addon.getLastException();
          if (lastEx) {
            const pinggyError = new PinggyError(lastEx);
            Logger.error(
              "Error setting auto-reconnect configuration:",
              pinggyError
            );
            throw pinggyError;
          } else {
            if (e instanceof Error) {
              Logger.error("Error setting auto-reconnect configuration:", e);
            } else {
              Logger.error(
                "Error setting auto-reconnect configuration:",
                new Error(String(e))
              );
            }
            throw e;
          }
        }
      }

      // Set force configuration if provided
      if (options.force !== undefined) {
        try {
          this.addon.configSetForce(configRef, options.force);
          Logger.info(`Force configuration set to: ${options.force}`);
        } catch (e) {
          const lastEx = this.addon.getLastException();
          if (lastEx) {
            const pinggyError = new PinggyError(lastEx);
            Logger.error("Error setting force configuration:", pinggyError);
            throw pinggyError;
          } else {
            if (e instanceof Error) {
              Logger.error("Error setting force configuration:", e);
            } else {
              Logger.error(
                "Error setting force configuration:",
                new Error(String(e))
              );
            }
            throw e;
          }
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

      Logger.info("Configurations applied successfully.");
      return configRef;
    } catch (e) {
      Logger.error("Error creating configuration:", e as Error);
      return 0;
    }
  }

  /**
   * Prepares and sets the argument string for the native config, based on options.
   * @param {number} configRef - The native config reference.
   * @param {PinggyOptions} options - The tunnel configuration options.
   */
  public prepareAndSetArgument(configRef: number, options: PinggyOptions) {
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

    let argument = join(val);
    if (options.cmd && options.cmd.trim()) {
      argument = `${options.cmd.trim()} ${argument}`;
    }

    Logger.info(`Setting config argument: ${argument}`);

    this.addon.configSetArgument(configRef, argument);
  }

  /**
   * Sets the authentication token for the tunnel.
   * @param {string} token - The authentication token.
   */
  public setToken(token: string): void {
    try {
      if (this.configRef) this.addon.configSetToken(this.configRef, token);
    } catch (e) {
      Logger.error("Error setting token:", e as Error);
    }
  }

  /**
   * Sets the server address for the tunnel.
   * @param {string} [address="a.pinggy.io:443"] - The server address.
   */
  public setServerAddress(address: string = "a.pinggy.io:443"): void {
    try {
      if (this.configRef)
        this.addon.configSetServerAddress(this.configRef, address);
    } catch (e) {
      Logger.error("Error setting server address:", e as Error);
    }
  }

  /**
   * Gets the current server address.
   * @returns {string | null} The server address, or null if unavailable.
   */
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

  /**
   * Gets the current SNI server name.
   * @returns {string | null} The SNI server name, or null if unavailable.
   */
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

  /**
   * Gets the current authentication token.
   * @returns {string | null} The authentication token, or null if unavailable.
   */
  public getToken(): string | null {
    try {
      return this.configRef ? this.addon.configGetToken(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting token:", e as Error);
      return null;
    }
  }

  /**
   * Gets the current argument string for the tunnel configuration.
   * @returns {string | null} The argument string, or null if unavailable.
   */
  public getArgument(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetArgument(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting argument:", e as Error);
      return null;
    }
  }

  /**
   * Sets the force configuration for the tunnel.
   * When enabled, forces the tunnel to use specific settings or bypass certain restrictions.
   * @param {boolean} force - Whether to enable force mode.
   */
  public setForce(force: boolean): void {
    try {
      if (this.configRef) {
        this.addon.configSetForce(this.configRef, force);
        Logger.info(`Force configuration set to: ${force}`);
      }
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error setting force configuration:", pinggyError);
        throw pinggyError;
      } else {
        if (e instanceof Error) {
          Logger.error("Error setting force configuration:", e);
        } else {
          Logger.error(
            "Error setting force configuration:",
            new Error(String(e))
          );
        }
        throw e;
      }
    }
  }

  /**
   * Gets the current force configuration setting.
   * @returns {boolean | null} The force setting, or null if unavailable.
   */
  public getForce(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetForce(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting force configuration:", e as Error);
      return null;
    }
  }

  /**
   * Gets the current auto-reconnect configuration setting.
   * @returns {boolean | null} The auto-reconnect setting, or null if unavailable.
   */
  public getAutoReconnect(): boolean | null {
    try {
      return this.configRef
        ? this.addon.configGetAutoReconnect(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting auto-reconnect configuration:", e as Error);
      return null;
    }
  }
}
