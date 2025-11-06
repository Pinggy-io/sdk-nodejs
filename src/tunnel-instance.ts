import { PinggyOptions, PinggyOptionsType } from "./pinggyOptions"
import { TunnelWorkerManager } from "./worker/tunnel-worker-manager";
import { Logger, LogLevel } from "./utils/logger"
import { Tunnel } from "./bindings/tunnel";
import { Config } from "./bindings/config";
import { TunnelUsageType } from "./bindings/tunnel-usage";
import { Callback, CallbackType, TunnelStatus, workerMessageType } from "./types";


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
  private callbacks = new Map<CallbackType, Function>();

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
            return this.workerManager.call("tunnel", method, workerMessageType.Call, ...args);
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
            return this.workerManager.call("config", method, workerMessageType.Call, ...args);
          };
        },
      }
    );

    if (!this.tunnel || !this.config) {
      throw new Error("Failed to create TunnelInstance proxies.");
    }
  }


  // ---------------- Callback Handling ---------------- //

  private handleWorkerCallback(event: CallbackType, data: any): void {
    const cb = this.callbacks.get(event);
    if (cb) {
      if (Array.isArray(data)) {
        // Already an array: spread it
        cb(...data);
      } else if (data && typeof data === "object") {
        // Object: spread its values as separate arguments
        cb(...Object.values(data));
      } else {
        // Primitive: pass as single argument
        cb(data);
      }
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

  private setCallback<K extends CallbackType>(type: K, callback: Callback<K>): void {
    this.callbacks.set(type, callback);
    this.workerManager.registerCallback(type);
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

  public async setDebugLogging(enable: boolean, logLevel: LogLevel = LogLevel.INFO): Promise<void> {
    this.workerManager.setDebugLoggingInWorker(enable, logLevel);
  }
  /**
   * Registers a callback function to receive errors from the tunnel worker.
   * It is recommended to always set this callback to ensure your program exits gracefully,
   * since if the tunnel worker exits, the tunnel is no longer active.
   * @param {function} callback - The callback function to receive errors.
   */
  public setWorkerErrorCallback(fn: Function) {
    this.workerManager.workerErrorCallback = fn;
  }

  /**
   * Gets the list of public URLs for the tunnel.
   *
   * Delegates to {@link Tunnel#getUrls}.
   *
   * @returns {Promise<string[]>} The list of public tunnel URLs.
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
 * @returns {Promise<string[]>} The greeting message.
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
   * @returns {Promise<void>}
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
   * @returns {Promise<string | null>} The tunnel usages as a string, or null if no usages are available.
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
   * @returns {Promise<TunnelUsageType | null>} The latest usage statistics, or null if unavailable.
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
    this.setCallback(CallbackType.TunnelUsageUpdate, callback);
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
    this.setCallback(CallbackType.TunnelError, callback);
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
    this.setCallback(CallbackType.TunnelDisconnected, callback)
  }

  /**
    * Sets a callback function to receive AdditionalForwarding events.
    *
    * Delegates to {@link Tunnel#setAdditionalForwardingCallback}.
    *
    * @param {function} callback - The callback function to receive AdditionalForwarding events.
    * @returns {void}
    * @throws {Error} If the tunnel is not initialized.
    */
  public setAdditionalForwardingCallback(callback: (bindAddress: string, forwardToAddr: string, errorMessage: string | null) => void): void {
    this.setCallback(CallbackType.TunnelAdditionalForwarding, callback)
  }

  /**
  * Sets a callback function to receive PrimaryForwarding events.
  *
  * Delegates to {@link Tunnel#setPrimaryForwardingCallback}.
  *
  * @param {function} callback - The callback function to receive PrimaryForwarding events.
  * @returns {void}
  * @throws {Error} If the tunnel is not initialized.
  */
  public setPrimaryForwardingCallback(callback: (message: string, address: string[]) => void): void {
    this.setCallback(CallbackType.TunnelPrimaryForwarding, callback)
  }

  /**
  * Sets a callback function to receive Authenticated events.
  *
  * Delegates to {@link Tunnel#setAuthenticatedCallback}.
  *
  * @param {function} callback - The callback function to receive Authenticated events.
  * @returns {void}
  * @throws {Error} If the tunnel is not initialized.
  */
  public setAuthenticatedCallback(callback: (message: string) => void): void {
    this.setCallback(CallbackType.TunnelAuthenticated, callback);
  }

  /**
   * Checks if the tunnel is currently active.
   *
   * Delegates to {@link Tunnel#tunnelIsActive}.
   *
   * @returns {Promise<boolean>} True if the tunnel is active, false otherwise.
   */
  public async isActive(): Promise<boolean> {
    return await this.activeTunnel.tunnelIsActive();
  }

  /**
   * Gets the current status of the tunnel.
   *
   * Returns the status from {@link Tunnel#status}.
   *
   * @returns {Promise<TunnelStatus>} The tunnel status.
   */
  public async getStatus(): Promise<TunnelStatus> {
    return await this.activeTunnel.getStatus();
  }

  /**
   * Gets the current server address for the tunnel.
   *
   * Delegates to {@link Config#getServerAddress}.
   *
   * @returns {Promise<string | null>} The server address, or null if unavailable.
   */
  public async getServerAddress(): Promise<string | null> {
    return await this.activeConfig.getServerAddress() ?? null;
  }

  /**
   * Gets the current authentication token for the tunnel.
   *
   * Delegates to {@link Config#getToken}.
   *
   * @returns {Promise<string | null>} The authentication token, or null if unavailable.
   */
  public async getToken(): Promise<string | null> {
    return await this.activeConfig.getToken() ?? null;
  }

  /**
   * Gets the current SNI server name for the tunnel.
   *
   * Delegates to {@link Config#getSniServerName}.
   *
   * @returns {Promise<string | null>} The SNI server name, or null if unavailable.
   */
  public async getSniServerName(): Promise<string | null> {
    return await this.activeConfig.getSniServerName() ?? null;
  }

  /**
   * Gets the current force configuration setting for the tunnel.
   *
   * Delegates to {@link Config#getForce}.
   *
   * @returns {Promise<boolean | null>} The force setting, or null if unavailable.
   */
  public async getForce(): Promise<boolean | null> {
    return await this.activeConfig.getForce() ?? null;
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
   * @returns {Promise<void>}
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
   * @returns {Promise<number>} The WebDebuggerPort setting, or `null` if not configured.
   */
  public async getWebDebuggerPort(): Promise<number> {
    return await this.activeTunnel.getWebDebuggerPort() ?? 0;
  }

  /**
   * Gets the current argument string for the tunnel configuration.
   *
   * Delegates to {@link Config#getArgument}.
   *
   * @returns {Promise<string | null>} The argument string, or null if unavailable.
   */
  public async getArgument(): Promise<string | null> {
    return await this.activeConfig.getArgument() ?? null;
  }

  /**
   * Gets the current tunnel type for the tunnel.
   *
   * Delegates to {@link Config#getTunnelType}.
   *
   * @returns {Promise<string | null>} The tunnel type, or null if unavailable.
   */
  public async getTunnelType(): Promise<string | null> {
    return await this.activeConfig.getTunnelType() ?? null;
  }

  /**
   * Gets the current UDP type for the tunnel.
   *
   * Delegates to {@link Config#getUdpType}.
   *
   * @returns {Promise<string | null>} The UDP type, or null if unavailable.
   */
  public async getUdpType(): Promise<string | null> {
    return await this.activeConfig.getUdpType() ?? null;
  }

  /**
  * Gets the current SSL setting for the tunnel.
  *
  * Delegates to {@link Config#getTunnelSsl}.
  *
  * @returns {Promise<boolean | null>} The SSL setting, or null if unavailable.
  */
  public async getTunnelSsl(): Promise<boolean | null> {
    return await this.activeConfig.getTunnelSsl() ?? null;
  }

  /**
  * Gets the TCP forward-to address for the tunnel.
  *
  * Delegates to {@link Config#getTcpForwardTo}.
  *
  * @returns {Promise<string | null>} The TCP forward-to address, or null if unavailable.
  */
  public async getTcpForwardTo(): Promise<string | null> {
    return await this.activeConfig.getTcpForwardTo() ?? null;
  }

  /**
  * Gets the UDP forward-to address for the tunnel.
  *
  * Delegates to {@link Config#getUdpForwardTo}.
  *
  * @returns {Promise<string | null>} The UDP forward-to address, or null if unavailable.
  */
  public async getUdpForwardTo(): Promise<string | null> {
    return await this.activeConfig.getUdpForwardTo() ?? null;
  }

  /**
   * Returns whether HTTPS-only mode is enabled for the tunnel instance.
   *
   * @returns {Promise<boolean | null>} `true` if HTTPS-only mode is enabled, `false` if disabled, or `null` if the configuration is unavailable.
   */
  public async getHttpsOnly(): Promise<boolean | null> {
    return await this.activeConfig.getHttpsOnly() ?? null;
  }

  /**
   * Retrieves IP whitelist for this tunnel instance.
   *
   * @returns {Promise<string[]> } An array of whitelisted IP addresses, or an empty array if no whitelist is configured.
   */
  public async getIpWhiteList(): Promise<string[]> {
    return await this.activeConfig.getIpWhiteList() ?? [];
  }

  /**
  * Retrieves Allow-Preflight configuration for this tunnel instance.
  *
  * @returns {Promise<boolean | null>} The Allow-Preflight sconfig*/
  public async getAllowPreflight(): Promise<boolean | null> {
    return await this.activeConfig.getAllowPreflight() ?? null;
  }

  /**
 * Retrieves No-Reverse-Proxy configuration for this tunnel instance.
 *
 * @returns {Promise<boolean | null>} The No-Reverse-Proxy setting, or `null` if not configured.
 */
  public async getNoReverseProxy(): Promise<boolean | null> {
    return await this.activeConfig.getNoReverseProxy();
  }

  /**
 * Retrieves X-Forwarded-For configuration for this tunnel instance.
 *
 * @returns {Promise<boolean | null>} The X-Forwarded-For setting, or `null` if not configured.
 */
  public async getXForwardedFor(): Promise<boolean | null> {
    return await this.activeConfig.getXForwardedFor();
  }

  /**
 * Retrieves Original-Request-URL configuration for this tunnel instance.
 *
 * @returns {Promise<boolean | null>} The Original-Request-URL setting, or `null` if not configured.
 */
  public async getOriginalRequestUrl(): Promise<boolean | null> {
    return await this.activeConfig.getOriginalRequestUrl();
  }

  /**
   * Retrieves the basic authentication values from the instance configuration.
   *
   * @returns {Promise<string[] | null>} An array of basic auth credentials when configured, or null if none are set.
   */
  public async getBasicAuth(): Promise<string[] | null> {
    return await this.activeConfig.getBasicAuth();
  }

  /**
   * Returns bearer token authentication values defined in the configuration.
   *
   * @returns {Promise<string[]>} An array of bearer token strings if present; otherwise an empty array.
   */
  public async getBearerTokenAuth(): Promise<string[]> {
    return await this.activeConfig.getBearerTokenAuth();
  }

  /**
   * Returns header modification values defined in the configuration.
   *
   * @returns {Promise<string[] | null>} An array of header modification objects if present; otherwise null.
   */
  public async getHeaderModification(): Promise<string[] | null> {
    return await this.activeConfig.getHeaderModification();
  }

  /**
   * Returns local server TLS configuration for this tunnel instance.
   *
   * @returns {Promise<string | null>} The local server TLS setting, or `null` if not configured.
   */
  public async getLocalServerTls(): Promise<string | null> {
    return await this.activeConfig.getLocalServerTls();
  }

  /**
   * Returns reconnect interval configuration for this tunnel instance.
   *
   * @returns {Promise<number | null>} The reconnect interval setting, or `null` if not configured.
   */
  public async getReconnectInterval(): Promise<number | null> {
    return await this.activeConfig.getReconnectInterval() ?? null;
  }

  /**
   * Returns auto-reconnect configuration for this tunnel instance.
   *
   * @returns {Promise<boolean | null>} The auto-reconnect setting, or `null` if not configured.
   */
  public async getAutoReconnect(): Promise<boolean | null> {
    return await this.activeConfig.getAutoReconnect();
  }

  /**
   * Returns MaxReconnectAttempts configuration for this tunnel instance.
   *
   * @returns {Promise<number | null>} The MaxReconnectAttempts setting, or `null` if not configured.
   */
  public async getMaxReconnectAttempts(): Promise<number | null> {
    return await this.activeConfig.getMaxReconnectAttempts();
  }

  /**
  * Returns the current tunnel configuration as a `PinggyOptions` object.
  * Extracts values from the instance and parses argument strings for advanced options.
  *
  * @returns {PinggyOptionsType | null} The tunnel configuration, or null if unavailable.
  */
  public async getConfig(): Promise<PinggyOptionsType | null> {
    const result = await this.workerManager.call("tunnel", "", workerMessageType.GetTunnelConfig);
    return result as PinggyOptions | null;
  }
}
