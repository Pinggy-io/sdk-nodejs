import { Logger } from "../utils/logger";
import { PinggyNative, Config as IConfig } from "../types";
import { PinggyOptions } from "../pinggyOptions";
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
  constructor(addon: PinggyNative, options: PinggyOptions) {
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

      if (!configRef) {
        const lastEx = this.addon.getLastException();
        if (lastEx) {
          const pinggyError = new PinggyError(lastEx);
          Logger.error("Failed to create native config:", pinggyError);
          throw pinggyError;
        } else {
          const err = new Error("Failed to create native config: received invalid reference");
          Logger.error(err.message);
          throw err;
        }
      }

      // Handle validation errors
      try {
        options.validate();
      } catch (validationError) {
        throw validationError instanceof PinggyError ? validationError : new Error(String(validationError));
      }

      if (options.token) {
        try {
          this.addon.configSetToken(configRef, options.token);
          Logger.info("Token set successfully");
        } catch (e) {
          const lastEx = this.addon.getLastException();
          if (lastEx) {
            const pinggyError = new PinggyError(lastEx);
            Logger.error("Error setting token:", pinggyError);
            throw pinggyError;
          } else {
            Logger.error("Error setting token:", e instanceof Error ? e : new Error(String(e)));
            throw e;
          }
        }
      }

      // Apply user-defined values or set defaults
      const serverAddress = options.serverAddress || "a.pinggy.io:443";
      const sniServerName = options.getSniServerName();
      let forwardTo = options.getForwardingPrimary() || "localhost:80";
      const ssl = options.getSsl() ?? true; // Default to true if not specified
      const type = options.tunnelType?.[0] || "http"; // Default to "http" if not specified

      // Set argument if provided
      if (options.getAdditionalArguments()?.trim()) {
        const argument = options.getAdditionalArguments()!.trim();
        Logger.info(`Setting config argument: ${argument}`);
        this.addon.configSetArgument(configRef, argument);
      }


      this.addon.configSetServerAddress(configRef, serverAddress);

      this.safeSet(
        () => {
          if (sniServerName) {
            this.addon.configSetSniServerName(configRef, sniServerName);
          }
        },
        "SNI server name configuration",
        sniServerName ? `SNI server name set to: ${sniServerName}` : undefined
      );

      this.safeSet(
        () => {
          if (options.httpsOnly !== undefined) {
            this.addon.configSetHttpsOnly(configRef, options.httpsOnly as boolean);
          }
        },
        "HTTPS-only configuration",
        options.httpsOnly !== undefined ? `HTTPS-only configuration set to: ${options.httpsOnly}` : undefined
      );

      // set allow preflight
      this.safeSet(
        () => {
          if (options.allowPreflight !== undefined) {
            this.addon.configSetAllowPreflight(configRef, options.allowPreflight as boolean);
          }
        },
        "Allow-Preflight configuration",
        options.allowPreflight !== undefined ? `Allow-Preflight configuration set to: ${options.allowPreflight}` : undefined
      );

      // set xff
      this.safeSet(
        () => {
          if (options.xForwardedFor !== undefined) {
            this.addon.configSetXForwardedFor(configRef, options.xForwardedFor as boolean);
          }
        },
        "X-Forwarded-For configuration",
        options.xForwardedFor !== undefined ? `X-Forwarded-For configuration set to: ${options.xForwardedFor}` : undefined
      );

      // set original request url
      this.safeSet(
        () => {
          if (options.originalRequestUrl !== undefined) {
            this.addon.configSetOriginalRequestUrl(configRef, options.originalRequestUrl as boolean);
          }
        },
        "Original-Request-URL configuration",
        options.originalRequestUrl !== undefined ? `Original-Request-URL configuration set to: ${options.originalRequestUrl}` : undefined
      );

      // set no reverse proxy
      this.safeSet(
        () => {
          if (options.reverseProxy !== undefined) {
            this.addon.configSetReverseProxy(configRef, options.reverseProxy as boolean);
          }
        },
        "No-Reverse-Proxy configuration",
        options.reverseProxy !== undefined ? `No-Reverse-Proxy configuration set to: ${options.reverseProxy}` : undefined
      );

      // Set IP whitelist if provided
      this.safeSet(
        () => {
          if (options.ipWhitelist && options.ipWhitelist.length > 0) {
            const ipWhitelist = JSON.stringify(options.ipWhitelist);
            this.addon.configSetIpWhiteList(configRef, ipWhitelist);
          }
        },
        "IP whitelist configuration",
        options.ipWhitelist && options.ipWhitelist.length > 0
          ? `IP whitelist set to: ${JSON.stringify(options.ipWhitelist)}`
          : undefined
      );

      // Set basic auth if provided (array of {username,password})
      this.safeSet(
        () => {
          if (options.basicAuth && options.basicAuth.length > 0) {
            this.addon.configSetBasicAuths(configRef, JSON.stringify(options.basicAuth));
          }
        },
        "Basic auth configuration",
        options.basicAuth && options.basicAuth.length > 0
          ? `Basic auth set to: ${JSON.stringify(options.basicAuth)}`
          : undefined
      );

      // Set bearer token if provided
      this.safeSet(
        () => {
          if (options.bearerTokenAuth && options.bearerTokenAuth?.length > 0) {
            this.addon.configSetBearerTokenAuths(configRef, JSON.stringify(options.bearerTokenAuth));
          }
        },
        "Bearer auth configuration",
        options.bearerTokenAuth && options.bearerTokenAuth?.length > 0
          ? `Bearer auth set to: ${JSON.stringify(options.bearerTokenAuth)}`
          : undefined
      );

      // Set header modifications if provided
      this.safeSet(
        () => {
          if (options.headerModification && options.headerModification?.length > 0) {
            this.addon.configSetHeaderModification(configRef, JSON.stringify(options.headerModification));
          }
        },
        "Header modification configuration",
        options.headerModification && options.headerModification?.length > 0
          ? `Header modification set to: ${JSON.stringify(options.headerModification)}`
          : undefined
      );

      // Set SSL configuration
      this.safeSet(
        () => {
          this.addon.configSetSsl(configRef, ssl);
        },
        "SSL configuration",
        `SSL configuration set to: ${ssl}`
      );

      // Set local server TLS configuration (may be derived)
      this.safeSet(
        () => {
          if (options.getLocalServerTls()) {
            this.addon.configSetLocalServerTls(configRef, options.getLocalServerTls() as string);
          }
        },
        "Local server TLS configuration",
        options.getLocalServerTls()
          ? `Local server TLS configuration set to: ${options.getLocalServerTls()}`
          : undefined
      );

      // Set auto-reconnect options
      this.safeSet(
        () => {
          if (options.autoReconnect !== undefined) {
            this.addon.configSetAutoReconnect(configRef, options.autoReconnect as boolean);
          }
        },
        "Auto-reconnect configuration",
        options.autoReconnect !== undefined
          ? `Auto-reconnect set to: ${options.autoReconnect}`
          : undefined
      );

      // Set reconnect interval if provided
      this.safeSet(
        () => {
          if (options.reconnectInterval !== undefined) {
            this.addon.configSetReconnectInterval(configRef, options.reconnectInterval as number);
          }
        },
        "Reconnect interval configuration",
        options.reconnectInterval !== undefined
          ? `Reconnect interval set to: ${options.reconnectInterval}`
          : undefined
      );

      // Set max reconnect attempts if provided
      this.safeSet(
        () => {
          if (options.maxReconnectAttempts !== undefined) {
            this.addon.configSetMaxReconnectAttempts(configRef, options.maxReconnectAttempts as number);
          }
        },
        "Max reconnect attempts configuration",
        options.maxReconnectAttempts !== undefined
          ? `Max reconnect attempts set to: ${options.maxReconnectAttempts}`
          : undefined
      );

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
      throw e;
    }
  }

  /**
   * Run a setter action with uniform error handling .
   * @param action - zero-arg function that performs the native call
   * @param label - label used in logs/errors
   * @param successMsg - optional success log message
   */
  private safeSet(action: () => void, label: string, successMsg?: string): void {
    // Call the native action (it won't throw)
    action();

    // Always check addon’s last exception after the call
    const lastEx = this.addon.getLastException();
    if (
      lastEx !== null &&
      lastEx !== undefined &&
      !(typeof lastEx === "string" && lastEx.trim().length === 0)
    ) {
      const pinggyError = new PinggyError(lastEx as any);
      Logger.error(`Error setting ${label}:`, pinggyError);
      throw pinggyError;
    }

    if (successMsg) {
      Logger.info(successMsg);
    }
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
   * Gets the current TCP forwarding address.
   * @returns {string | null} The TCP forwarding address, or null if unavailable.
   */
  public getTcpForwardTo(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetTcpForwardTo(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting TCP forward configuration:", e as Error);
      return null;
    }
  }

  /**
   * Gets the current UDP forwarding address.
   * @returns {string | null} The UDP forwarding address, or null if unavailable.
   */
  public getUdpForwardTo(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetUdpForwardTo(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting UDP forward configuration:", e as Error);
      return null;
    }
  }

  /**
   * Gets the tunnel type.
   * @returns {string | null} The tunnel type, or null if unavailable.
   */
  public getTunnelType(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetType(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting tunnel type configuration:", e as Error);
      return null;
    }
  }

  /**
   * Gets the tunnel type.
   * @returns {string | null} The tunnel type, or null if unavailable.
   */
  public getUdpType(): string | null {
    try {
      return this.configRef
        ? this.addon.configGetUdpType(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting tunnel type configuration:", e as Error);
      return null;
    }
  }

  /**
   * Gets the current SSL configuration for the tunnel.
   * @returns {boolean | null} The SSL setting, or null if unavailable.
   */
  public getTunnelSsl(): boolean | null {
    try {
      return this.configRef
        ? this.addon.configGetSsl(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting tunnel ssl configuration:", e as Error);
      return null;
    }
  }

  /**
   * Gets the current HTTPS-only configuration setting.
   * @returns {boolean | null} The HTTPS-only setting, or null if unavailable.
   */
  public getHttpsOnly(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetHttpsOnly(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting HTTPS-only configuration:", e as Error);
      return null;
    }
  }

  public getIpWhiteList(): string[] {
    try {
      if (!this.configRef) {
        Logger.error("Config reference is not initialized.");
        throw new Error("Config reference is not initialized.");
      }

      const raw = this.addon.configGetIpWhiteList(this.configRef);

      // If the config always returns a JSON string
      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      Logger.error("Error getting IP whitelist configuration:", e as Error);
      return [];
    }
  }

  public getAllowPreflight(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetAllowPreflight(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting Allow-Preflight configuration:", e as Error);
      return null;
    }
  }

  public getXForwardedFor(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetXForwardedFor(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting X-Forwarded-For configuration:", e as Error);
      return null;
    }
  }

  public getOriginalRequestUrl(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetOriginalRequestUrl(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting Original-Request-URL configuration:", e as Error);
      return null;
    }
  }

  public getNoReverseProxy(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetReverseProxy(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting No-Reverse-Proxy configuration:", e as Error);
      return null;
    }
  }
  public getBasicAuth(): string[] | null {
    try {
      if (!this.configRef) {
        Logger.error("Config reference is not initialized.");
        throw new Error("Config reference is not initialized.");
      }
      const raw = this.addon.configGetBasicAuths(this.configRef);
      // If the config always returns a JSON string
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      Logger.error("Error getting Basic Auth configuration:", e as Error);
      return null;
    }
  }

  public getBearerTokenAuth(): string[] {
    try {
      if (!this.configRef) {
        Logger.error("Config reference is not initialized.");
        throw new Error("Config reference is not initialized.");
      }
      const raw = this.addon.configGetBearerTokenAuths(this.configRef);
      // If the config always returns a JSON string
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      Logger.error("Error getting Bearer Token Auth configuration:", e as Error);
      return [];
    }
  }

  public getHeaderModification(): string[] | null {
    try {
      if (!this.configRef) {
        Logger.error("Config reference is not initialized.");
        throw new Error("Config reference is not initialized.");
      }
      const raw = this.addon.configGetHeaderModification(this.configRef);
      // If the config always returns a JSON string
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      Logger.error("Error getting Header Modification configuration:", e as Error);
      return null;
    }
  }

  public getLocalServerTls(): string | null {
    try {
      return this.configRef ? this.addon.configGetLocalServerTls(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting Local Server TLS configuration:", e as Error);
      return null;
    }
  }
  public getAutoReconnect(): boolean | null {
    try {
      return this.configRef ? this.addon.configGetAutoReconnect(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting Auto-Reconnect configuration:", e as Error);
      return null;
    }
  }

  public getReconnectInterval(): number | null {
    try {
      return this.configRef ? this.addon.configGetReconnectInterval(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting Reconnect Interval configuration:", e as Error);
      return null;
    }
  }

  public getMaxReconnectAttempts(): number | null {
    try {
      return this.configRef ? this.addon.configGetMaxReconnectAttempts(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting Max Reconnect Attempts configuration:", e as Error);
      return null;
    }
  }
}
