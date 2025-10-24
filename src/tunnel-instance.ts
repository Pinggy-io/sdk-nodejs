import { HeaderModification, PinggyOptions, PinggyOptionsType, TunnelType } from "./pinggyOptions"
import { TunnelWorkerManager } from "./worker/tunnel-worker-manager";
import { Logger } from "./utils/logger"
import { Tunnel } from "./bindings/tunnel";
import { Config } from "./bindings/config";
import { TunnelUsageType } from "./bindings/tunnel-usage";
import { TunnelStatus } from "./types";


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
  // All tunnel/config operations are delegated to a worker manager
  private workerManager: TunnelWorkerManager
  public tunnel: Tunnel | null = null; // dynamic proxy
  public config: Config | null = null; // dynamic proxy
  private callbacks = new Map<string, Function>();

  /**
   * Creates a new TunnelInstance with the provided native addon and options.
   *
   * Internally creates a {@link Config} and a {@link Tunnel}.
   *
   * @param addon - The native addon instance.
   * @param options - The tunnel configuration options.
   */

  constructor(options: PinggyOptions) {
    // initialize worker manager
    this.workerManager = new TunnelWorkerManager(options);
    this.workerManager.setCallbackHandler((event, data) => this.handleWorkerCallback(event, data));

    // Create proxy for this.tunnel and this.config such that their methods will be executed within this.workerManager.call function.
    // This allows us to call the tunnel and config methods without writing message passing code every time
    const tunnelMethods = Object.getOwnPropertyNames(Tunnel.prototype)
      .filter((prop) => typeof (Tunnel.prototype as any)[prop] === "function" && prop !== "constructor");

    const configMethods = Object.getOwnPropertyNames(Config.prototype).filter((prop) => typeof (Config.prototype as any)[prop] === "function" && prop !== "constructor");

    this.tunnel = new Proxy<Tunnel>(
      {} as Tunnel,
      {
        get: (_, method: string) => {
          if (!tunnelMethods.includes(method)) {
            throw new Error(`Tunnel method "${method}" does not exist`);
          }
          return async (...args: any[]) => {
            await this.ensureWorkerReady();
            return this.workerManager.call("tunnel", method, ...args);
          };
        },
      }
    );

    this.config = new Proxy<Config>(
      {} as Config,
      {
        get: (_, method: string) => {
          if (!configMethods.includes(method)) {
            throw new Error(`Config method "${method}" does not exist`);
          }
          return async (...args: any[]) => {
            await this.ensureWorkerReady();
            return this.workerManager.call("config", method, ...args);
          };
        },
      }
    );

    if (!this.tunnel || !this.config) {
      throw new Error("Failed to create TunnelInstance proxies.");
    }
  }

  private async ensureWorkerReady() {
    await this.workerManager.ensureReady();
  }

  // ---------------- Callback Handling ---------------- //

  private handleWorkerCallback(event: string, data: any): void {
    const cb = this.callbacks.get(event);
    if (cb) {
      cb(...(Array.isArray(data) ? data : [data]));
    }
    Logger.info(`Handled worker callback: ${event}`);
  }

  private get activeTunnel(): Tunnel {
    if (!this.tunnel) {
      throw new Error("Tunnel not initialized or has been stopped");
    }
    return this.tunnel
  }

  private get activeConfig(): Config {
    if (!this.config) {
      throw new Error("Config not initialized or has been stopped.");
    }
    return this.config;
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
    return await this.activeTunnel.start();
  }

  public async setDebugLogging(enable: boolean): Promise<void> {
    this.workerManager.setDebugLoggingInWorker(enable);
  }

  /**
   * Gets the list of public URLs for the tunnel.
   *
   * Delegates to {@link Tunnel#getUrls}.
   *
   * @returns {string[]} The list of public tunnel URLs.
   */
  public async urls(): Promise<string[]> {
    return await this.activeTunnel.getUrls();
  }

  /**
   * Stops the tunnel and cleans up resources.
   *
   * Delegates to {@link Tunnel#tunnelStop}.
   *
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public async stop(): Promise<void> {
    await this.activeTunnel.tunnelStop();
    this.tunnel = null;
    this.config = null;
    await this.workerManager.terminate();
  }

  /**
 * Get greeting message for the tunnel.
 *
 * Delegates to {@link Tunnel#getTunnelGreetMessage}.
 *
 * @returns {string[]} The greeting message.
 * @throws {Error} If the tunnel is not initialized.
 */
  public async getGreetMessage(): Promise<string[]> {
    return await this.activeTunnel.getTunnelGreetMessage();
  }

  /**
   * Starts continuous usage updates for the tunnel.
   *
   * @throws {Error} If the tunnel instance or its tunnelRef is not initialized.
   * @returns void
   */
  public startUsageUpdate(): void {
    this.activeTunnel.startTunnelUsageUpdate();
  }

  /**
   * Stops continuous usage updates for the tunnel.
   *
   * @throws {Error} If the tunnel instance or its tunnelRef is not initialized.
   * @returns void
   */

  public async stopUsageUpdate(): Promise<void> {
    await this.activeTunnel.stopTunnelUsageUpdate();
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
  public async getUsages(): Promise<string | null> {
    return await this.activeTunnel.getTunnelUsages();
  }

  /**
   * Get the latest usage statistics for the tunnel.
   *
   * Delegates to {@link Tunnel#getLatestUsage}.
   *
   * @returns {Record<string, any> | null} The latest usage statistics, or null if unavailable.
   * @throws {Error} If the tunnel is not initialized.
   */
  public async getLatestUsage(): Promise<TunnelUsageType | null> {
    return await this.activeTunnel.getLatestUsage();
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
    this.callbacks.set("usageUpdate", callback);
    this.workerManager.registerCallback("usageUpdate");
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
    this.callbacks.set("tunnelError", callback);
    this.workerManager.registerCallback("tunnelError");
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
    this.callbacks.set("tunnelDisconnected", callback);
    this.workerManager.registerCallback("tunnelDisconnected");
  }

  /**
   * Checks if the tunnel is currently active.
   *
   * Delegates to {@link Tunnel#tunnelIsActive}.
   *
   * @returns {boolean} True if the tunnel is active, false otherwise.
   */
  public async isActive(): Promise<boolean> {
    return await this.activeTunnel.tunnelIsActive();
  }

  /**
   * Gets the current status of the tunnel.
   *
   * Returns the status from {@link Tunnel#status}.
   *
   * @returns {"starting" | "live" | "closed"} The tunnel status.
   */
  public async getStatus(): Promise<TunnelStatus> {
    return await this.activeTunnel?.getStatus();
  }

  /**
   * Gets the current server address for the tunnel.
   *
   * Delegates to {@link Config#getServerAddress}.
   *
   * @returns {string | null} The server address, or null if unavailable.
   */
  public async getServerAddress(): Promise<string | null> {
    return await this.activeConfig?.getServerAddress() ?? null;
  }

  /**
   * Gets the current authentication token for the tunnel.
   *
   * Delegates to {@link Config#getToken}.
   *
   * @returns {string | null} The authentication token, or null if unavailable.
   */
  public async getToken(): Promise<string | null> {
    return await this.activeConfig.getToken() ?? null;
  }

  /**
   * Gets the current SNI server name for the tunnel.
   *
   * Delegates to {@link Config#getSniServerName}.
   *
   * @returns {string | null} The SNI server name, or null if unavailable.
   */
  public async getSniServerName(): Promise<string | null> {
    return await this.activeConfig.getSniServerName() ?? null;
  }

  /**
   * Gets the current force configuration setting for the tunnel.
   *
   * Delegates to {@link Config#getForce}.
   *
   * @returns {boolean | null} The force setting, or null if unavailable.
   */
  public async getForce(): Promise<boolean | null> {
    return await this.config?.getForce() ?? null;
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
    this.activeTunnel.startWebDebugging(port);
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
  public async tunnelRequestAdditionalForwarding(
    hostname: string,
    target: string
  ): Promise<void> {
    await this.activeTunnel.tunnelRequestAdditionalForwarding(hostname, target);
  }

  /**
   * Returns WebDebuggerPort configuration for this tunnel instance.
   *
   * @returns The WebDebuggerPort setting, or `null` if not configured.
   */
  public async getWebDebuggerPort(): Promise<number> {
    return await this.activeTunnel.getWebDebuggerPort() ?? 0;
  }

  /**
   * Gets the current argument string for the tunnel configuration.
   *
   * Delegates to {@link Config#getArgument}.
   *
   * @returns {string | null} The argument string, or null if unavailable.
   */
  public async getArgument(): Promise<string | null> {
    return await this.config?.getArgument() ?? null;
  }

  /**
   * Gets the current tunnel type for the tunnel.
   *
   * Delegates to {@link Config#getTunnelType}.
   *
   * @returns {string | null} The tunnel type, or null if unavailable.
   */
  public async getTunnelType(): Promise<string | null> {
    return await this.config?.getTunnelType() ?? null;
  }

  /**
   * Gets the current UDP type for the tunnel.
   *
   * Delegates to {@link Config#getUdpType}.
   *
   * @returns {string | null} The UDP type, or null if unavailable.
   */
  public async getUdpType(): Promise<string | null> {
    return await this.config?.getUdpType() ?? null;
  }

  /**
  * Gets the current SSL setting for the tunnel.
  *
  * Delegates to {@link Config#getTunnelSsl}.
  *
  * @returns {boolean | null} The SSL setting, or null if unavailable.
  */
  public async getTunnelSsl(): Promise<boolean | null> {
    return await this.config?.getTunnelSsl() ?? null;
  }

  /**
  * Gets the TCP forward-to address for the tunnel.
  *
  * Delegates to {@link Config#getTcpForwardTo}.
  *
  * @returns {string | null} The TCP forward-to address, or null if unavailable.
  */
  public async getTcpForwardTo(): Promise<string | null> {
    return await this.config?.getTcpForwardTo() ?? null;
  }

  /**
  * Gets the UDP forward-to address for the tunnel.
  *
  * Delegates to {@link Config#getUdpForwardTo}.
  *
  * @returns {string | null} The UDP forward-to address, or null if unavailable.
  */
  public async getUdpForwardTo(): Promise<string | null> {
    return await this.config?.getUdpForwardTo() ?? null;
  }

  /**
   * Returns whether HTTPS-only mode is enabled for the tunnel instance.
   *
   * @returns {boolean | null} `true` if HTTPS-only mode is enabled, `false` if disabled, or `null` if the configuration is unavailable.
   */
  public async getHttpsOnly(): Promise<boolean | null> {
    return await this.config?.getHttpsOnly() ?? null;
  }

  /**
   * Retrieves IP whitelist for this tunnel instance.
   *
   * @returns {string[]} An array of whitelisted IP addresses, or an empty array if no whitelist is configured.
   */
  public async getIpWhiteList(): Promise<string[]> {
    return await this.config?.getIpWhiteList() ?? [];
  }

  /**
  * Retrieves Allow-Preflight configuration for this tunnel instance.
  *
  * @returns {boolean | null} The Allow-Preflight sconfig*/
  public async getAllowPreflight(): Promise<boolean | null> {
    return await this.config?.getAllowPreflight() ?? null;
  }

  /**
 * Retrieves No-Reverse-Proxy configuration for this tunnel instance.
 *
 * @returns {boolean | null} The No-Reverse-Proxy setting, or `null` if not configured.
 */
  public getNoReverseProxy(): boolean | null {
    return this.activeConfig.getNoReverseProxy();
  }

  /**
 * Retrieves X-Forwarded-For configuration for this tunnel instance.
 *
 * @returns {boolean | null} The X-Forwarded-For setting, or `null` if not configured.
 */
  public getXForwardedFor(): boolean | null {
    return this.activeConfig.getXForwardedFor();
  }

  /**
 * Retrieves Original-Request-URL configuration for this tunnel instance.
 *
 * @returns {boolean | null} The Original-Request-URL setting, or `null` if not configured.
 */
  public getOriginalRequestUrl(): boolean | null {
    return this.activeConfig.getOriginalRequestUrl();
  }

  /**
   * Retrieves the basic authentication values from the instance configuration.
   *
   * @returns An array of basic auth credentials when configured, or null if none are set.
   */
  public getBasicAuth(): string[] | null {
    return this.activeConfig.getBasicAuth();
  }

  /**
   * Returns bearer token authentication values defined in the configuration.
   *
   * @returns An array of bearer token strings if present; otherwise an empty array.
   */
  public getBearerTokenAuth(): string[] {
    return this.activeConfig.getBearerTokenAuth();
  }

  /**
   * Returns header modification values defined in the configuration.
   *
   * @returns An array of header modification objects if present; otherwise null.
   */
  public getHeaderModification(): string[] | null {
    return this.activeConfig.getHeaderModification();
  }

  /**
   * Returns local server TLS configuration for this tunnel instance.
   *
   * @returns The local server TLS setting, or `null` if not configured.
   */
  public getLocalServerTls(): string | null {
    return this.activeConfig.getLocalServerTls();
  }

  /**
   * Returns reconnect interval configuration for this tunnel instance.
   *
   * @returns The reconnect interval setting, or `null` if not configured.
   */
  public getReconnectInterval(): number | null {
    return this.activeConfig.getReconnectInterval() ?? null;
  }

  /**
   * Returns auto-reconnect configuration for this tunnel instance.
   *
   * @returns The auto-reconnect setting, or `null` if not configured.
   */
  public getAutoReconnect(): boolean | null {
    return this.activeConfig.getAutoReconnect();
  }

  /**
   * Returns MaxReconnectAttempts configuration for this tunnel instance.
   *
   * @returns The MaxReconnectAttempts setting, or `null` if not configured.
   */
  public getMaxReconnectAttempts(): number | null {
    return this.activeConfig.getMaxReconnectAttempts();
  }

  /**
  * Returns the current tunnel configuration as a `PinggyOptions` object.
  * Extracts values from the instance and parses argument strings for advanced options.
  *
  * @returns {PinggyOptionsType | null} The tunnel configuration, or null if unavailable.
  */
  public async getConfig(): Promise<PinggyOptionsType | null> {
    const options: PinggyOptionsType = { optional: {} };

    // Add directly accessible properties
    const serverAddress = await this.getServerAddress();
    options.serverAddress = serverAddress || "";

    const token = await this.getToken();
    options.token = token || "";

    const sniServerName = await this.getSniServerName();
    options.optional!.sniServerName = sniServerName || "";

    const force = await this.getForce();
    options.force = force || false;

    const httpsOnly = await this.getHttpsOnly();
    options.httpsOnly = httpsOnly !== null ? httpsOnly : false;

    const ipWhiteList = await this.getIpWhiteList();
    options.ipWhitelist = ipWhiteList;

    const allowPreflight = await this.getAllowPreflight();
    options.allowPreflight = allowPreflight !== null ? allowPreflight : false;

    const noReverseProxy = await this.getNoReverseProxy();
    options.reverseProxy = noReverseProxy !== null ? noReverseProxy : false;

    const xForwardedFor = await this.getXForwardedFor();
    options.xForwardedFor = xForwardedFor !== null ? xForwardedFor : false;

    const originalRequestUrl = await this.getOriginalRequestUrl();
    options.originalRequestUrl = originalRequestUrl !== null ? originalRequestUrl : false;

    const rawAuthValue = await this.getBasicAuth();

    options.basicAuth = normalizeBasicAuth(rawAuthValue as string | BasicAuthItem[] | null);

    const bearerAuth = await this.getBearerTokenAuth();
    options.bearerTokenAuth = bearerAuth;

    const reconnectInterval = await this.getReconnectInterval();
    options.reconnectInterval = reconnectInterval !== null ? reconnectInterval : 0;

    const maxReconnectAttempts = await this.getMaxReconnectAttempts();
    options.maxReconnectAttempts = maxReconnectAttempts !== null ? maxReconnectAttempts : 0;

    const autoReconnect = await this.getAutoReconnect();
    options.autoReconnect = autoReconnect !== null ? autoReconnect : false;

    const headerModificationRaw = await this.getHeaderModification() as unknown as HeaderModification[];

    const webDebuggerPort = await this.getWebDebuggerPort();
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



    let type = (await this.getTunnelType()) || (await this.getUdpType());

    if (type === "tcp" || type === "tls" || type === "http" || type === "udp") {
      options.tunnelType = [type as any];
      if (type === "http" || type === "tcp" || type === "tls") {
        const tcpForwardTo = await this.getTcpForwardTo();
        options.forwarding = tcpForwardTo || "";
      } else if (type === "udp") {
        const udpForwardTo = await this.getUdpForwardTo();
        options.forwarding = udpForwardTo || "";
      }
    } else {
      options.tunnelType = [TunnelType.Http];
      options.forwarding = "";
    }

    const ssl = await this.getTunnelSsl();
    options.optional!.ssl = ssl !== null ? ssl : false;


    const argString = await this.getArgument() || "";
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
