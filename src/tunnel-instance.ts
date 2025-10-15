import { PinggyNative, TunnelStatus } from "./types";
import { HeaderModification, PinggyOptionsType, PinggyOptions } from "./pinggyOptions"
import { Config } from "./bindings/config";
import { Tunnel } from "./bindings/tunnel";
import { Logger } from "./utils/logger";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "./bindings/exception";
import { TunnelUsageType } from "./bindings/tunnel-usage";

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
      this.tunnel = new Tunnel(this.addon, this.config.configRef, options);
    } catch (e) {
      // If the error is already a proper Error object (like validation errors),
      // preserve it instead of trying to convert it to PinggyError
      if (e instanceof PinggyError) {
        Logger.error("Tunnel init error:", e);
        throw e;
      }

      // For other types of errors, check if there's a native exception
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
 * Get greeting message for the tunnel.
 *
 * Delegates to {@link Tunnel#getTunnelGreetMessage}.
 *
 * @returns {string[]} The greeting message.
 * @throws {Error} If the tunnel is not initialized.
 */
  public getGreetMessage(): string[] {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    return this.tunnel.getTunnelGreetMessage();
  }

  /**
   * Starts continuous usage updates for the tunnel.
   *
   * @throws {Error} If the tunnel instance or its tunnelRef is not initialized.
   * @returns void
   */
  public startUsageUpdate(): void {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    this.tunnel.startTunnelUsageUpdate();
  }

  /**
   * Stops continuous usage updates for the tunnel.
   *
   * @throws {Error} If the tunnel instance or its tunnelRef is not initialized.
   * @returns void
   */

  public stopUsageUpdate(): void {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    this.tunnel.stopTunnelUsageUpdate();
  }

  /**
   * Retrieves usage information from the underlying tunnel instance.
   *
   * This method delegates to the tunnel's getTunnelUsages() implementation. If the tunnel is not initialized or its reference is
   * missing, an Error is thrown.
   *
   * @returns The tunnel usages as a string, or null if no usages are available.
   * @throws {Error} If the tunnel or its tunnelRef is not initialized.
   */
  public getUsages(): string | null {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    return this.tunnel.getTunnelUsages();
  }

  /**
   * Get the latest usage statistics for the tunnel.
   *
   * Delegates to {@link Tunnel#getLatestUsage}.
   *
   * @returns {Record<string, any> | null} The latest usage statistics, or null if unavailable.
   * @throws {Error} If the tunnel is not initialized.
   */
  public getLatestUsage(): TunnelUsageType | null {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    return this.tunnel.getLatestUsage();
  }

  /**
   * Sets a callback function to receive usage updates.
   *
   * Delegates to {@link Tunnel#setUsageUpdateCallback}.
   *
   * @param {function} callback - The callback function to receive usage updates.
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public setUsageUpdateCallback(callback: (usage: Record<string, any>) => void): void {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    this.tunnel.setUsageUpdateCallback(callback);
  }

  /**
   * Sets a callback function to receive errors.
   *
   * Delegates to {@link Tunnel#setTunnelErrorCallback}.
   *
   * @param {function} callback - The callback function to receive errors.
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public setTunnelErrorCallback(callback: (errorNo: number, error: string, recoverable: boolean) => void): void {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    this.tunnel.setTunnelErrorCallback(callback);
  }

  /**
   * Sets a callback function to receive disconnected events.
   *
   * Delegates to {@link Tunnel#setTunnelDisconnectedCallback}.
   *
   * @param {function} callback - The callback function to receive disconnected events.
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public setTunnelDisconnectedCallback(callback: (error: string, messages: string[]) => void): void {
    if (!this.tunnel || !this.tunnel.tunnelRef) throw new Error("Tunnel not initialized");
    this.tunnel.setTunnelDisconnectedCallback(callback);
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
   * Returns whether HTTPS-only mode is enabled for the tunnel instance.
   *
   * @returns {boolean | null} `true` if HTTPS-only mode is enabled, `false` if disabled, or `null` if the configuration is unavailable.
   */
  public getHttpsOnly(): boolean | null {
    return this.config?.getHttpsOnly() ?? null;
  }

  /**
   * Retrieves IP whitelist for this tunnel instance.
   *
   * @returns {string[]} An array of whitelisted IP addresses, or an empty array if no whitelist is configured.
   */
  public getIpWhiteList(): string[] {
    return this.config?.getIpWhiteList() ?? [];
  }

  /**
 * Retrieves Allow-Preflight configuration for this tunnel instance.
 *
 * @returns {boolean | null} The Allow-Preflight setting, or `null` if not configured.
 */
  public getAllowPreflight(): boolean | null {
    return this.config?.getAllowPreflight() ?? null;
  }

  /**
 * Retrieves No-Reverse-Proxy configuration for this tunnel instance.
 *
 * @returns {boolean | null} The No-Reverse-Proxy setting, or `null` if not configured.
 */
  public getNoReverseProxy(): boolean | null {
    return this.config?.getNoReverseProxy() ?? null;
  }

  /**
 * Retrieves X-Forwarded-For configuration for this tunnel instance.
 *
 * @returns {boolean | null} The X-Forwarded-For setting, or `null` if not configured.
 */
  public getXForwardedFor(): boolean | null {
    return this.config?.getXForwardedFor() ?? null;
  }

  /**
 * Retrieves Original-Request-URL configuration for this tunnel instance.
 *
 * @returns {boolean | null} The Original-Request-URL setting, or `null` if not configured.
 */
  public getOriginalRequestUrl(): boolean | null {
    return this.config?.getOriginalRequestUrl() ?? null;
  }

  /**
   * Retrieves the basic authentication values from the instance configuration.
   *
   * @returns An array of basic auth credentials when configured, or null if none are set.
   */
  public getBasicAuth(): string[] | null {
    return this.config?.getBasicAuth() ?? null;
  }

  /**
   * Returns bearer token authentication values defined in the configuration.
   *
   * @returns An array of bearer token strings if present; otherwise an empty array.
   */
  public getBearerTokenAuth(): string[] {
    return this.config?.getBearerTokenAuth() ?? [];
  }

  /**
   * Returns header modification values defined in the configuration.
   *
   * @returns An array of header modification objects if present; otherwise null.
   */
  public getHeaderModification(): string[] | null {
    return this.config?.getHeaderModification() ?? null;
  }

  /**
   * Returns local server TLS configuration for this tunnel instance.
   *
   * @returns The local server TLS setting, or `null` if not configured.
   */
  public getLocalServerTls(): string | null {
    return this.config?.getLocalServerTls() ?? null;
  }

  /**
   * Returns reconnect interval configuration for this tunnel instance.
   *
   * @returns The reconnect interval setting, or `null` if not configured.
   */
  public getReconnectInterval(): number | null {
    return this.config?.getReconnectInterval() ?? null;
  }

  /**
   * Returns auto-reconnect configuration for this tunnel instance.
   *
   * @returns The auto-reconnect setting, or `null` if not configured.
   */
  public getAutoReconnect(): boolean | null {
    return this.config?.getAutoReconnect() ?? null;
  }

  /**
   * Returns MaxReconnectAttempts configuration for this tunnel instance.
   *
   * @returns The MaxReconnectAttempts setting, or `null` if not configured.
   */
  public getMaxReconnectAttempts(): number | null {
    return this.config?.getMaxReconnectAttempts() ?? null;
  }

  /**
   * Returns WebDebuggerPort configuration for this tunnel instance.
   *
   * @returns The WebDebuggerPort setting, or `null` if not configured.
   */
  public getWebDebuggerPort(): number {
    return this.tunnel?.getWebDebuggerPort() ?? 0;
  }
  /**
  * Returns the current tunnel configuration as a `PinggyOptions` object.
  * Extracts values from the instance and parses argument strings for advanced options.
  *
  * @returns {PinggyOptionsType | null} The tunnel configuration, or null if unavailable.
  */
  public getConfig(): PinggyOptionsType | null {
    const options: PinggyOptionsType = { optional: {} };

    // Add directly accessible properties
    const serverAddress = this.getServerAddress();
    options.serverAddress = serverAddress || "";

    const token = this.getToken();
    options.token = token || "";

    const sniServerName = this.getSniServerName()
    options.optional!.sniServerName = sniServerName || "";

    const force = this.getForce();
    options.force = force || false;

    const httpsOnly = this.getHttpsOnly();
    options.httpsOnly = httpsOnly !== null ? httpsOnly : false;

    const ipWhiteList = this.getIpWhiteList();
    options.ipWhitelist = ipWhiteList;

    const allowPreflight = this.getAllowPreflight();
    options.allowPreflight = allowPreflight !== null ? allowPreflight : false;

    const noReverseProxy = this.getNoReverseProxy();
    options.reverseProxy = noReverseProxy !== null ? noReverseProxy : false;

    const xForwardedFor = this.getXForwardedFor();
    options.xForwardedFor = xForwardedFor !== null ? xForwardedFor : false;

    const originalRequestUrl = this.getOriginalRequestUrl();
    options.originalRequestUrl = originalRequestUrl !== null ? originalRequestUrl : false;

    const rawAuthValue = this.getBasicAuth();

    options.basicAuth = normalizeBasicAuth(rawAuthValue as string | BasicAuthItem[] | null);

    const bearerAuth = this.getBearerTokenAuth();
    options.bearerTokenAuth = bearerAuth;

    const reconnectInterval = this.getReconnectInterval();
    options.reconnectInterval = reconnectInterval !== null ? reconnectInterval : 0;

    const maxReconnectAttempts = this.getMaxReconnectAttempts();
    options.maxReconnectAttempts = maxReconnectAttempts !== null ? maxReconnectAttempts : 0;

    const autoReconnect = this.getAutoReconnect();
    options.autoReconnect = autoReconnect !== null ? autoReconnect : false;

    const headerModificationRaw = this.getHeaderModification() as unknown as HeaderModification[];

    const webDebuggerPort = this.getWebDebuggerPort();
    options.webDebugger = `localhost:${webDebuggerPort}`;

    options.headerModification = Array.isArray(headerModificationRaw)
      ? headerModificationRaw.map(h => {
        if (h.type === "remove") {
          return { key: h.key, type: "remove" as const };
        }
        return {
          key: h.key,
          type: h.type,
          value: Array.isArray(h.value) ? h.value : [],
        };
      })
      : [];



    let type = this.getTunnelType() || this.getUdpType()

    if (type === "tcp" || type === "tls" || type === "http" || type === "udp") {
      options.tunnelType = [type as any];
      if (type === "http" || type === "tcp" || type === "tls") {
        const tcpForwardTo = this.getTcpForwardTo();
        options.forwarding = tcpForwardTo || "";
      } else if (type === "udp") {
        const udpForwardTo = this.getUdpForwardTo();
        options.forwarding = udpForwardTo || "";
      }
    } else {
      options.tunnelType = ["http"] as any;
      options.forwarding = "";
    }

    const ssl = this.getTunnelSsl();
    options.optional!.ssl = ssl !== null ? ssl : false;


    const argString = this.getArgument() || "";
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const argumentInParts: string[] = [];
    let match;
    while ((match = regex.exec(argString)) !== null) {
      argumentInParts.push(match[1] || match[2] || match[0]);
    }

    if (argumentInParts.length > 0 && !argumentInParts[0].startsWith("w:") &&
      !argumentInParts[0].startsWith("b:") && !argumentInParts[0].startsWith("k:") &&
      !argumentInParts[0].startsWith("a:") && !argumentInParts[0].startsWith("r:") &&
      !argumentInParts[0].startsWith("u:") && !argumentInParts[0].startsWith("x:")
    ) {
      options.optional!.additionalArguments = argumentInParts[0];
    }
    return options;
  }
}

type BasicAuthItem = { username: string; password: string };

function normalizeBasicAuth(input: string | BasicAuthItem[] | null): BasicAuthItem[] {
  let parsed: BasicAuthItem[] | null = null;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      parsed = null;
    }
  } else {
    parsed = input ?? null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return [];
  }

  return parsed.filter(({ username, password }) => !!username && !!password);
}
