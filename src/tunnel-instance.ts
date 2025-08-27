import { PinggyNative, PinggyOptions, TunnelStatus } from "./types";
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
  public getStatus(): TunnelStatus {
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

  /**
   * Gets the current tunnel type for the tunnel.
   *
   * Delegates to {@link Config#getTunnelType}.
   *
   * @returns {string | null} The tunnel type, or null if unavailable.
   */
  public getTunnelType(): string | null {
    return this.config?.getTunnelType() ?? null;
  }

  /**
   * Gets the current UDP type for the tunnel.
   *
   * Delegates to {@link Config#getUdpType}.
   *
   * @returns {string | null} The UDP type, or null if unavailable.
   */
  public getUdpType(): string | null {
    return this.config?.getUdpType() ?? null;
  }

  /**
  * Gets the current SSL setting for the tunnel.
  *
  * Delegates to {@link Config#getTunnelSsl}.
  *
  * @returns {boolean | null} The SSL setting, or null if unavailable.
  */
  public getTunnelSsl(): boolean | null {
    return this.config?.getTunnelSsl() ?? null;
  }

  /**
  * Gets the TCP forward-to address for the tunnel.
  *
  * Delegates to {@link Config#getTcpForwardTo}.
  *
  * @returns {string | null} The TCP forward-to address, or null if unavailable.
  */
  public getTcpForwardTo(): string | null {
    return this.config?.getTcpForwardTo() ?? null;
  }

  /**
  * Gets the UDP forward-to address for the tunnel.
  *
  * Delegates to {@link Config#getUdpForwardTo}.
  *
  * @returns {string | null} The UDP forward-to address, or null if unavailable.
  */
  public getUdpForwardTo(): string | null {
    return this.config?.getUdpForwardTo() ?? null;
  }

  /**
  * Returns the current tunnel configuration as a `PinggyOptions` object.
  * Extracts values from the instance and parses argument strings for advanced options.
  *
  * @returns {PinggyOptions | null} The tunnel configuration, or null if unavailable.
  */
  public getConfig(): PinggyOptions | null {
    const options: PinggyOptions = {};

    // Add directly accessible properties
    const serverAddress = this.getServerAddress();
    options.serverAddress = serverAddress ? serverAddress : "";

    const token = this.getToken();
    options.token = token ? token : "";

    const sniServerName = this.getSniServerName()
    options.sniServerName = sniServerName ? sniServerName : "";

    const force = this.getForce();
    options.force = force ? force : false;

    const udpType = this.getUdpType();

    let type = this.getTunnelType();
    
    if (!type && udpType) {
      type = "udp";
    }

    if (type === "tcp" || type === "tls" || type === "http" || type === "udp") {
      options.type = type;
      if (type === "http" || type === "tcp" || type === "tls") {
        const tcpForwardTo = this.getTcpForwardTo();
        options.forwardTo = tcpForwardTo ? tcpForwardTo : "";
      } else if (type === "udp") {
        const udpForwardTo = this.getUdpForwardTo();
        options.forwardTo = udpForwardTo ? udpForwardTo : "";
      }
    } else {
      options.type = "http";
      options.forwardTo = "";
    }

    const ssl = this.getTunnelSsl();
    options.ssl = ssl !== null ? ssl : false;


    const argString = this.getArgument() || "";
    const argumentInParts = argString.split(" ");
    if (argumentInParts.length > 0 && !argumentInParts[0].startsWith("w:") &&
      !argumentInParts[0].startsWith("b:") && !argumentInParts[0].startsWith("k:") &&
      !argumentInParts[0].startsWith("a:") && !argumentInParts[0].startsWith("r:") &&
      !argumentInParts[0].startsWith("u:") && !argumentInParts[0].startsWith("x:")
    ) {
      options.cmd = argumentInParts[0];
    }

    // Initialize arrays and objects with empty defaults
    options.ipWhitelist = [];
    options.basicAuth = {};
    options.bearerAuth = [];
    options.headerModification = [];
    options.xff = false;
    options.httpsOnly = false;
    options.fullRequestUrl = false;
    options.allowPreflight = false;
    options.noReverseProxy = false;


    // Parse Ip whitelist, auth settings, and other flags
    for (const argument of argumentInParts) {
      if (argument.startsWith('w:')) {
        options.ipWhitelist!.push(...argument.substring(2).split(','));
      } else if (argument.startsWith('b:')) {
        const [_, user, pass] = argument.split(':');
        if (user && pass) options.basicAuth![user] = pass;
      } else if (argument.startsWith('k:')) {
        options.bearerAuth!.push(argument.substring(2));
      } else if (argument.startsWith('a:')) {
        const [_, key, value] = argument.split(':');
        if (key && value) options.headerModification!.push({ action: 'add', key, value });
      } else if (argument.startsWith('r:')) {
        options.headerModification!.push({ action: 'remove', key: argument.substring(2) });
      } else if (argument.startsWith('u:')) {
        const [_, key, value] = argument.split(':');
        if (key && value) options.headerModification!.push({ action: 'update', key, value });
      } else if (argument === 'x:xff') {
        options.xff = true;
      } else if (argument === 'x:https') {
        options.httpsOnly = true;
      } else if (argument === 'x:fullurl') {
        options.fullRequestUrl = true;
      } else if (argument === 'x:passpreflight') {
        options.allowPreflight = true;
      } else if (argument === 'x:noreverseproxy') {
        options.noReverseProxy = true;
      }
    }

    return options;
  }
}
