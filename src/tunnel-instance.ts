import {PinggyNative, PinggyOptions, TunnelStatus} from "./types";
import { Config } from "./bindings/config";
import { Tunnel } from "./bindings/tunnel";
import { Logger } from "./utils/logger";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "./bindings/exception";

/**
 * Represents a high-level tunnel instance, managing both configuration and tunnel lifecycle.
 * Provides methods to start, stop, and interact with a Pinggy tunnel.
 *
 * Internally uses {@link Config} for configuration and {@link Tunnel} for tunnel management.
 *
 * @group Classes
 * @public
 */
export class TunnelInstance {
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  private addon: PinggyNative;

  /**
   * Creates a new TunnelInstance with the provided native addon and options.
   *
   * Internally creates a {@link Config} and a {@link Tunnel}.
   *
   * @param addon - The native addon instance.
   * @param options - The tunnel configuration options.
   */
  constructor(addon: PinggyNative, options: PinggyOptions) {
    this.addon = addon;
    initExceptionHandling(this.addon);

    // set debug logging to false initially
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

  /**
   * Starts the tunnel and returns the public URLs.
   *
   * Delegates to {@link Tunnel#start}.
   *
   * @returns {Promise<string[]>} Resolves with the list of public tunnel URLs.
   * @throws {Error} If the tunnel is not initialized or fails to start.
   */
  public async start(): Promise<string[]> {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    return await this.tunnel.start();
  }

  /**
   * Gets the list of public URLs for the tunnel.
   *
   * Delegates to {@link Tunnel#getUrls}.
   *
   * @returns {string[]} The list of public tunnel URLs.
   */
  public urls(): string[] {
    return this.tunnel?.getUrls() ?? [];
  }

  /**
   * Stops the tunnel and cleans up resources.
   *
   * Delegates to {@link Tunnel#tunnelStop}.
   *
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public stop(): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    this.tunnel.tunnelStop();
    this.tunnel = null;
    this.config = null;
  }

  /**
   * Checks if the tunnel is currently active.
   *
   * Delegates to {@link Tunnel#tunnelIsActive}.
   *
   * @returns {boolean} True if the tunnel is active, false otherwise.
   */
  public isActive(): boolean {
    if (!this.tunnel) return false;
    return this.tunnel.tunnelIsActive();
  }

  /**
   * Gets the current status of the tunnel.
   *
   * Returns the status from {@link Tunnel#status}.
   *
   * @returns {"starting" | "live" | "closed"} The tunnel status.
   */
  public getStatus(): TunnelStatus{
    return this.tunnel?.status ?? TunnelStatus.CLOSED;
  }

  /**
   * Gets the current server address for the tunnel.
   *
   * Delegates to {@link Config#getServerAddress}.
   *
   * @returns {string | null} The server address, or null if unavailable.
   */
  public getServerAddress(): string | null {
    return this.config?.getServerAddress() ?? null;
  }

  /**
   * Gets the current authentication token for the tunnel.
   *
   * Delegates to {@link Config#getToken}.
   *
   * @returns {string | null} The authentication token, or null if unavailable.
   */
  public getToken(): string | null {
    return this.config?.getToken() ?? null;
  }

  /**
   * Gets the current SNI server name for the tunnel.
   *
   * Delegates to {@link Config#getSniServerName}.
   *
   * @returns {string | null} The SNI server name, or null if unavailable.
   */
  public getSniServerName(): string | null {
    return this.config?.getSniServerName() ?? null;
  }

  /**
   * Gets the current force configuration setting for the tunnel.
   *
   * Delegates to {@link Config#getForce}.
   *
   * @returns {boolean | null} The force setting, or null if unavailable.
   */
  public getForce(): boolean | null {
    return this.config?.getForce() ?? null;
  }

  /**
   * Starts web debugging for the tunnel on the specified local port.
   *
   * Delegates to {@link Tunnel#startWebDebugging}.
   *
   * @param {number} port - The local port to start web debugging on.
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public startWebDebugging(port: number): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    this.tunnel.startWebDebugging(port);
  }

  /**
   * Requests additional forwarding for the tunnel.
   *
   * Delegates to {@link Tunnel#tunnelRequestAdditionalForwarding}.
   *
   * @param {string} hostname - The remote address to forward from.
   * @param {string} target - The local address to forward to.
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public tunnelRequestAdditionalForwarding(
    hostname: string,
    target: string
  ): void {
    if (!this.tunnel) throw new Error("Tunnel not initialized");
    this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
  }

  /**
   * Gets the current argument string for the tunnel configuration.
   *
   * Delegates to {@link Config#getArgument}.
   *
   * @returns {string | null} The argument string, or null if unavailable.
   */
  public getArgument(): string | null {
    return this.config?.getArgument() ?? null;
  }
}
