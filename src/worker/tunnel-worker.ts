import { parentPort, workerData } from "worker_threads";
import { CallbackPayloadMap, CallbackType, PinggyNative, TunnelUsageType, TunnelWorkerLogConfig, WorkerMessage, workerMessageType } from "../types.js";
import { Config } from "../bindings/config.js";
import { Tunnel } from "../bindings/tunnel.js";
import { Logger, LogLevel } from "../utils/logger.js";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "../bindings/exception.js";
import { BasicAuthItem, HeaderModification, TunnelConfiguration, TunnelConfigurationV1 } from "../tunnelConfiguration.js";
import { loadAddon } from "../utils/loadAddon.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class TunnelWorker {
  private addon: PinggyNative | null = null;
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  private registeredCallbacks: Set<CallbackType> = new Set();
  private initialLogConfig: TunnelWorkerLogConfig;

  constructor(rawTunnelOptions: any, logConfig?: TunnelWorkerLogConfig) {
    this.initialLogConfig = {
      enabled: logConfig?.enabled ?? false,
      logLevel: logConfig?.logLevel ?? LogLevel.INFO,
      logFilePath: logConfig?.logFilePath ?? null,
    };

    this.applyJsLoggingConfig();
    this.initialize(rawTunnelOptions);
    this.registerMessageHandlers();
    this.startParentMonitor();
  }

  private applyJsLoggingConfig(): void {
    Logger.setDebugEnabled(
      this.initialLogConfig.enabled,
      this.initialLogConfig.logFilePath
    );
    Logger.setLevel(this.initialLogConfig.logLevel);
    Logger.setSink((level, line) => {
      parentPort?.postMessage({ type: workerMessageType.Log, source: "sdk-js", level, line });
    });
  }

  private applyNativeLoggingConfig(): void {
    if (!this.addon) return;
    this.addon.setLogEnable(this.initialLogConfig.enabled);
    this.addon.setDebugLogging(this.initialLogConfig.enabled);
  }

  /**
   * Initialize native addon, config, and tunnel
   */
  private initialize(pinggyOptions: any): void {
    try {
      this.addon = loadAddon(path.join(__dirname, "../../lib/addon.node")) as PinggyNative;
      if (!this.addon) throw new Error("Failed to load native addon.");

      initExceptionHandling(this.addon);

      // Apply worker/native logging BEFORE Config creation
      this.applyNativeLoggingConfig();

      const options = new TunnelConfiguration(pinggyOptions);
      this.config = new Config(this.addon, options);

      if (!this.config.configRef) throw new Error("Failed to initialize config.");

      this.tunnel = new Tunnel(this.addon, this.config.configRef, options);

      if (!this.tunnel) throw new Error("Failed to initialize tunnel.");

      this.attachCallbacks();

      // Register native log callback if supported
      if (typeof (this.addon as any).setLogCallback === 'function' && this.tunnel) {
        (this.addon as any).setLogCallback(this.tunnel.tunnelRef, (level: LogLevel, line: string) => {
          parentPort?.postMessage({ type: workerMessageType.Log, source: "libpinggy", level, line });
        });
      }

      this.postMessage({ type: workerMessageType.Init, success: true, error: null });
    } catch (e: any) {
      const pinggyError = this.convertToPinggyError(e);
      Logger.error("TunnelWorker init error:", pinggyError);
      this.postMessage({
        type: workerMessageType.Init,
        success: false,
        error: pinggyError.message,
      });
    }
  }

  /**
   * Converts any unknown error into a PinggyError
   */
  private convertToPinggyError(e: unknown): Error {
    if (e instanceof PinggyError) return e;
    const lastEx = this.addon ? getLastException(this.addon) : null;
    return lastEx ? new PinggyError(lastEx) : new Error(String(e));
  }

  /**
   * Handle messages (method calls) from the main thread
   */
  private registerMessageHandlers(): void {
    parentPort?.on("message", async (msg: WorkerMessage) => {
      if (!msg || typeof msg !== "object") {
        Logger.debug(`Ignoring malformed message: ${JSON.stringify(msg)}`);
        return;
      }
      Logger.debug(`[Worker] method invoke request recived inside worker ${JSON.stringify(msg)}`);

      switch (msg.type) {
        case workerMessageType.RegisterCallback:
          this.registeredCallbacks.add(msg.event);
          Logger.info(`Registered callback: ${msg.event}`);
          return;

        case workerMessageType.Call:
          await this.handleMainThreadCall(msg);
          return;

        case workerMessageType.EnableLogger:
          this.setDebugLogging(msg.enabled, msg.logLevel, msg.logFilePath);
          return
        case workerMessageType.GetTunnelConfig:
          this.getTunnelConfig(msg);
          return;
          
        default:
          Logger.info(`Unhandled message type from main thread: ${msg.type}`);
      }
    });

    parentPort?.on("close", () => this.cleanup());
  }
  /**
   * Handle main thread messages (method calls) and send response to main thread
   * 
   */

  private async handleMainThreadCall(msg: Extract<WorkerMessage, { type: workerMessageType.Call }>) {
    const { id, target, method, args } = msg;

    if (!this.tunnel || !this.config) {
      const missing = !this.tunnel ? "Tunnel" : "Config";
      this.sendResponse(id, null, `${missing} not initialized`);
      return;
    }

    try {
      const targetObject = target === "config" ? this.config : this.tunnel;
      const fn = (targetObject as any)[method];
      if (typeof fn !== "function") throw new Error(`Unknown method: ${method}`);

      const result = await fn.apply(targetObject, args || []);
      this.sendResponse(id, result);
    } catch (err: any) {
      Logger.error("TunnelWorker call error:", err);
      this.sendResponse(id, null, err?.message || String(err));
    }
  }

  /**
   * Relay native callbacks back to the main thread
   */
  private attachCallbacks(): void {
    if (!this.tunnel) return;

    const callbacks = {
      usageUpdate: (usage: TunnelUsageType) =>
        this.forwardCallback(CallbackType.TunnelUsageUpdate, usage),
      tunnelError: (errorNo: number, error: string, recoverable: boolean) =>
        this.forwardCallback(CallbackType.TunnelError, { errorNo, error, recoverable }),
      tunnelDisconnected: (error: string, messages: string[]) =>
        this.forwardCallback(CallbackType.TunnelDisconnected, { error, messages }),
      tunnelAdditionalForwarding: (bindAddress: string, forwardToAddr: string, errorMessage: string | null) =>
        this.forwardCallback(CallbackType.TunnelAdditionalForwarding, { bindAddress, forwardToAddr, errorMessage }),
      tunnelEstablishedCallback: (message: string ,urls?: string[]) =>
        this.forwardCallback(CallbackType.TunnelEstablished, { message, urls }),
      tunnelForwardingChanged: (message: string, address?: string[]) =>
        this.forwardCallback(CallbackType.ForwardingChanged, { message, address }),
      willReconnect: (error: string, messages: string[]) =>
        this.forwardCallback(CallbackType.WillReconnect, { error, messages }),
      reconnecting: (retryCnt: number) =>
        this.forwardCallback(CallbackType.Reconnecting, { retryCnt }),
      reconnectionCompleted: (urls: string[]) =>
        this.forwardCallback(CallbackType.ReconnectionCompleted, { urls }),
      reconnectionFailed: (retryCnt: number) =>
        this.forwardCallback(CallbackType.ReconnectionFailed, { retryCnt }),
      pollingError: (error: Error) =>
        this.forwardCallback(CallbackType.PollingError, { error }),
      cleanupComplete:()=>{
        Logger.info("Tunnel cleanup completed.");
        this.forwardCallback(CallbackType.TunnelCleanupComplete, {});
      }
    };

    this.tunnel.setUsageUpdateCallback(callbacks.usageUpdate);
    this.tunnel.setTunnelErrorCallback(callbacks.tunnelError);
    this.tunnel.setTunnelDisconnectedCallback(callbacks.tunnelDisconnected);
    this.tunnel.setAdditionalForwardingCallback(callbacks.tunnelAdditionalForwarding)
    this.tunnel.setTunnelEstablishedCallback(callbacks.tunnelEstablishedCallback);
    this.tunnel.setOnTunnelForwardingChanged(callbacks.tunnelForwardingChanged);
    this.tunnel.setWillReconnectCallback(callbacks.willReconnect);
    this.tunnel.setReconnectingCallback(callbacks.reconnecting);
    this.tunnel.setReconnectionCompletedCallback(callbacks.reconnectionCompleted);
    this.tunnel.setReconnectionFailedCallback(callbacks.reconnectionFailed);
    this.tunnel.setPollingErrorCallback(callbacks.pollingError);
    this.tunnel.setCleanupCompleteCallback(callbacks.cleanupComplete);
  }

  /**
   * Send a callback event to the main thread only if registered.
   */
  private forwardCallback<K extends CallbackType>(event: K, data:CallbackPayloadMap[K]) {
    Logger.debug(`[Worker] Callback recived. Callbackname: ${event},data:${JSON.stringify(data)}`)
    if (!this.registeredCallbacks.has(event)) return;
    this.postMessage({
      type: workerMessageType.Callback,
      event,
      data,
    });
  }

  /**
   * Send a response back to the main thread
   */
  private sendResponse(id: string, result: any, error?: string): void {
    Logger.debug(`[Worker]Sending response back to main thread. ID:${id}`)
    this.postMessage({
      type: workerMessageType.Response,
      id,
      result,
      error,
    });
  }

  /**
   * Gracefully clean up resources when the worker shuts down
   */
  private cleanup(): void {
    try {
      this.tunnel?.tunnelStop();
    } catch (e) {
      Logger.error(`TunnelWorker cleanup error: ${e}`);
    }
    Logger.setSink(null);
    this.tunnel = null;
    this.config = null;
    this.addon = null;
  }

  /**
   * Post a message safely to the main thread.
   */
  private postMessage(msg: WorkerMessage): void {
    if (!parentPort) {
      Logger.error("Cannot post message: parentPort is null");
      return;
    }
    parentPort.postMessage(msg);
  }

  private setDebugLogging(
    enabled: boolean = false,
    logLevel: LogLevel = LogLevel.INFO,
    logFilePath: string | null
  ): void {
    this.initialLogConfig = {
      enabled,
      logLevel,
      logFilePath: logFilePath ?? null,
    };

    this.applyJsLoggingConfig();
    this.applyNativeLoggingConfig();
  }

  /**
   * Monitor if the main thread is still alive so orphaned workers clean up.
   *
   * Worker threads share the same `process` object as the main thread, so
   * `process.ppid` reflects the OS parent of the *process*, NOT the main
   * thread.
   */
  private startParentMonitor(): void {
    if (parentPort) {
      parentPort.on('close', () => {
        Logger.info('[Worker] Parent port closed (main thread exited), cleaning up...');
        this.cleanup();
        process.exit(0);
      });
    }
  }


  private async getTunnelConfig(msg: Extract<WorkerMessage, { type: workerMessageType.GetTunnelConfig }>) {
    const { id } = msg
    const tunnelConfig = await this.getConfig();
    this.sendResponse(id, tunnelConfig);
  }

  private async getConfig(): Promise<TunnelConfigurationV1 | null> {
    const options: TunnelConfigurationV1 = { optional: {} };
    if (!this.config || !this.tunnel) return null;
    // Run all independent async calls in parallel
    const [
      serverAddress,
      token,
      sniServerName,
      force,
      httpsOnly,
      ipWhiteList,
      allowPreflight,
      noReverseProxy,
      xForwardedFor,
      originalRequestUrl,
      rawAuthValue,
      bearerAuth,
      reconnectInterval,
      maxReconnectAttempts,
      autoReconnect,
      headerModificationRaw,
      webDebugger,
      forwardingJSON,
      ssl,
      argString,
    ] = await Promise.all([
      this.config.getServerAddress(),
      this.config.getToken(),
      this.config.getSniServerName(),
      this.config.getForce(),
      this.config.getHttpsOnly(),
      this.config.getIpWhiteList(),
      this.config.getAllowPreflight(),
      this.config.getNoReverseProxy(),
      this.config.getXForwardedFor(),
      this.config.getOriginalRequestUrl(),
      this.config.getBasicAuth(),
      this.config.getBearerTokenAuth(),
      this.config.getReconnectInterval(),
      this.config.getMaxReconnectAttempts(),
      this.config.getAutoReconnect(),
      this.config.getHeaderModification() as unknown as Promise<HeaderModification[]>,
      this.tunnel.GetWebDebuggerAddress(),
      this.config.getForwarding(),
      this.config.getTunnelSsl(),
      this.config.getArgument(),
    ]);

    // Assign simple values
    options.serverAddress = serverAddress || "";
    options.token = token || "";
    options.optional!.sniServerName = sniServerName || "";
    options.force = force || false;
    options.httpsOnly = httpsOnly ?? false;
    options.ipWhitelist = ipWhiteList;
    options.allowPreflight = allowPreflight ?? false;
    options.reverseProxy = noReverseProxy ?? false;
    options.xForwardedFor = xForwardedFor ?? false;
    options.originalRequestUrl = originalRequestUrl ?? false;
    options.basicAuth = this.normalizeBasicAuth(rawAuthValue as BasicAuthItem[] | null);
    options.bearerTokenAuth = bearerAuth;
    options.reconnectInterval = reconnectInterval ?? 0;
    options.maxReconnectAttempts = maxReconnectAttempts ?? 0;
    options.autoReconnect = autoReconnect ?? false;
    options.webDebugger = webDebugger;
    options.optional!.ssl = ssl ?? false;

    // Handle header modification
    options.headerModification = Array.isArray(headerModificationRaw)
      ? headerModificationRaw.map(h =>
        h.type === "remove"
          ? { key: h.key, type: "remove" as const }
          : { key: h.key, type: h.type, value: Array.isArray(h.value) ? h.value : [] },
      )
      : [];

    // Parse forwarding JSON to extract type and forwarding address
    if (forwardingJSON) {
      try {
      const forwardingRules = JSON.parse(forwardingJSON);
      if (Array.isArray(forwardingRules) && forwardingRules.length > 0) {
        options.forwarding = forwardingRules || null;
      } else {
        options.forwarding = null;
      }
      } catch (e) {
      Logger.error("Failed to parse forwarding JSON:", e as Error);
      options.forwarding = null;
      }
    } else {
      options.forwarding = null;
    }

    // Parse argument string
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const argumentInParts: string[] = [];
    let match;
    while ((match = regex.exec(argString || "")) !== null) {
      argumentInParts.push(match[1] || match[2] || match[0]);
    }

    if (
      argumentInParts.length > 0 &&
      !/^(w:|b:|k:|a:|r:|u:|x:)/.test(argumentInParts[0])
    ) {
      options.optional!.additionalArguments = argumentInParts[0];
    }

    return options;
  }


  private normalizeBasicAuth(input: BasicAuthItem[] | null): BasicAuthItem[] {
    let parsed: BasicAuthItem[] | null = null;
    parsed = input || []
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    return parsed.filter(({ username, password }) => !!username && !!password);
  }

}

// ======== Worker Entrypoint ======== //
const { options, logConfig } = workerData;
new TunnelWorker(options, logConfig);
