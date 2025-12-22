import { PinggyOptions, PinggyOptionsType } from "./pinggyOptions.js"
import { TunnelWorkerManager } from "./worker/tunnel-worker-manager.js";
import { Logger, LogLevel } from "./utils/logger.js"
import { Tunnel } from "./bindings/tunnel.js";
import { Config } from "./bindings/config.js";
import { Callback, CallbackMap, CallbackPayloadMap, CallbackType, TunnelStatus, TunnelUsageType, workerMessageType } from "./types.js";


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
   * Internal constructor - use TunnelInstance.create() instead.
   * Internally creates a {@link Config} and a {@link Tunnel}.
   * @internal
   */

  constructor(workerManager: TunnelWorkerManager) {
    // initialize worker manager
    this.workerManager = workerManager;

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
  /**
   * Creates a new TunnelInstance with the specified options.
   * Internally creates a {@link TunnelWorkerManager}, {@link Config}, and {@link Tunnel}.
   * @param options 
   * @public
   * @returns 
   */

  public static async create(options: PinggyOptionsType): Promise<TunnelInstance> {

    // If the worker fails, TunnelWorkerManager.create will throw, and the error 
    // will be caught by the outer 'try/catch'.
    const workerManager = await TunnelWorkerManager.create(new PinggyOptions(options));

    // Now that the worker is guaranteed to be ready
    const instance = new TunnelInstance(workerManager);

    // Set up the async handler
    instance.workerManager.setCallbackHandler((event, data) => instance.handleWorkerCallback(event, data));

    return instance;
  }


  // ---------------- Callback Handling ---------------- //

  private handleWorkerCallback<K extends CallbackType>(
    event: K,
    data: CallbackPayloadMap[K]
  ): void {

    const cb = this.callbacks.get(event) as Callback<K> | undefined;
    if (!cb) return;

    (cb as any)(data);

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

  public async setDebugLogging(enable: boolean, logLevel: LogLevel = LogLevel.INFO, logFilePath: string | null): Promise<void> {
    this.workerManager.setDebugLoggingInWorker(enable, logLevel, logFilePath);
  }
  /**
   * Registers a callback function to receive errors from the tunnel worker.
   * It is recommended to always set this callback to ensure your program exits gracefully,
   * since if the tunnel worker exits, the tunnel is no longer active.
   * @param {function} callback - The callback function to receive errors.
   */
  public setWorkerErrorCallback(callback: Function) {
    this.workerManager.workerErrorCallback = callback;
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
  public setUsageUpdateCallback(callback: CallbackMap[CallbackType.TunnelUsageUpdate]): void {
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
  public setTunnelErrorCallback(callback: CallbackMap[CallbackType.TunnelError]): void {
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
  public setTunnelDisconnectedCallback(callback: CallbackMap[CallbackType.TunnelDisconnected]): void {
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
  public setAdditionalForwardingCallback(callback: CallbackMap[CallbackType.TunnelAdditionalForwarding]): void {
    this.setCallback(CallbackType.TunnelAdditionalForwarding, callback)
  }

  /**
  * Sets a callback function to receive Tunnel established events.
  *
  * Delegates to {@link Tunnel#setTunnelEstablishedCallback}.
  *
  * @param {function} callback - The callback function to receive Tunnel established events.
  * @returns {void}
  * @throws {Error} If the tunnel is not initialized.
  */
  public setTunnelEstablishedCallback(callback: CallbackMap[CallbackType.TunnelEstablished]): void {
    this.setCallback(CallbackType.TunnelEstablished, callback)
  }

  /**
  * Sets a callback function to receive Forwarding changed events.
  *
  * Delegates to {@link Tunnel#setOnTunnelForwardingChanged}.
  *
  * @param {function} callback - The callback function to receive Forwarding change events.
  * @returns {void}
  * @throws {Error} If the tunnel is not initialized.
  */
  public setTunnelForwardingChangedCallback(callback: CallbackMap[CallbackType.ForwardingChanged]): void {
    this.setCallback(CallbackType.ForwardingChanged, callback);
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
   * @param {string} listenAddress - The local port to start web debugging on.
   * @returns {void}
   * @throws {Error} If the tunnel is not initialized.
   */
  public startWebDebugging(listenAddress: string): void {
    this.activeTunnel.startWebDebugging(listenAddress);
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
   * Gets the forwarding rules configuration.
   * Returns a JSON string containing all forwarding rules configured for this tunnel.
   * Delegates to {@link Config#getForwarding}.
   *
   * @returns {Promise<string | null>} The tunnel type, or null if unavailable.
   */
  public async getForwarding(): Promise<string | null> {
    return await this.activeConfig.getForwarding() ?? null;
  }

  /**
   * Gets the current tunnel state for the tunnel.
   *
   * Delegates to {@link Tunnel#GetTunnelState}.
   *
   * @returns {Promise<string>} The tunnel state as a string.
   */
  public async GetTunnelState(): Promise<string> {
    const state = await this.activeTunnel.GetTunnelState();
    return state;
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

  public getWebDebuggerAddress(): string{
    return this.activeTunnel.GetWebDebuggerAddress();
  }

  public async getWebDebuggerInfo(): Promise<string | null>{
    return await this.activeConfig.getWebdebuggerAddr();
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
