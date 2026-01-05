import { parentPort, workerData } from "worker_threads";
import { CallbackPayloadMap, CallbackType, PinggyNative, TunnelUsageType, WorkerMessage, workerMessageType } from "../types.js";
import { Config } from "../bindings/config.js";
import { Tunnel } from "../bindings/tunnel.js";
import { Logger, LogLevel } from "../utils/logger.js";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "../bindings/exception.js";
import { BasicAuthItem, HeaderModification, PinggyOptions, PinggyOptionsType, TunnelType } from "../pinggyOptions.js";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);


class TunnelWorker {
  private addon: PinggyNative | null = null;
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  private registeredCallbacks: Set<CallbackType> = new Set();
  private parentPid: number;
  private parentCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(rawTunnelOptions: any) {
    // Store the parent PID at startup to detect if parent dies
    this.parentPid = process.ppid;
    this.initialize(rawTunnelOptions);
    this.registerMessageHandlers();
    this.startParentMonitor();
  }

  /**
   * Initialize native addon, config, and tunnel
   */
  private initialize(pinggyOptions: any): void {
    try {
      const addonPath = path.join(__dirname, "../../lib/addon.node");
      this.addon = require(addonPath);
      if (!this.addon) throw new Error("Failed to load native addon.");

      initExceptionHandling(this.addon);
      this.addon.setLogEnable(false);

      const options = new PinggyOptions(pinggyOptions);
      this.config = new Config(this.addon, options);

      if (!this.config.configRef) throw new Error("Failed to initialize config.");

      this.tunnel = new Tunnel(this.addon, this.config.configRef, options);

      if (!this.tunnel) throw new Error("Failed to initialize tunnel.")

      // Attach native callbacks
      this.attachCallbacks();

      // Inform main thread initialization succeeded
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
    };

    this.tunnel.setUsageUpdateCallback(callbacks.usageUpdate);
    this.tunnel.setTunnelErrorCallback(callbacks.tunnelError);
    this.tunnel.setTunnelDisconnectedCallback(callbacks.tunnelDisconnected);
    this.tunnel.setAdditionalForwardingCallback(callbacks.tunnelAdditionalForwarding)
    this.tunnel.setTunnelEstablishedCallback(callbacks.tunnelEstablishedCallback);
    this.tunnel.setOnTunnelForwardingChanged(callbacks.tunnelForwardingChanged);
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
    // Stop monitoring parent process
    this.stopParentMonitor();
    
    try {
      this.tunnel?.tunnelStop();
    } catch (e) {
      Logger.error(`TunnelWorker cleanup error: ${e}`);
    }
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

  private setDebugLogging(enabled: boolean = false, logLevel: LogLevel = LogLevel.INFO, logFilePath: string | null): void {
    this.addon?.setLogEnable(enabled)
    this.addon?.setDebugLogging(enabled)
    Logger.setDebugEnabled(enabled, logFilePath)
    Logger.setLevel(logLevel);
  }

  /**
   * Monitor if the parent process is still alive.
   * When parent is killed, the worker's ppid changes.
   * This catches cases where the parent is killed
   */
  private startParentMonitor(): void {
    const PARENT_CHECK_INTERVAL_MS = 1000; // Check every second

    this.parentCheckInterval = setInterval(() => {
      const currentPpid = process.ppid;
      
      // If parent PID changed (parent died and we were adopted by init/systemd)
      if (currentPpid !== this.parentPid) {
        Logger.info(`[Worker] Parent process died (ppid changed from ${this.parentPid} to ${currentPpid}), cleaning up and exiting...`);
        this.stopParentMonitor();
        this.cleanup();
        process.exit(0);
      }
      
      // Additional check: try to verify parent is still alive using kill(pid, 0)
      // This sends no signal but checks if process exists. To know more https://man7.org/linux/man-pages/man2/kill.2.html
      try {
        process.kill(this.parentPid, 0);
      } catch (err: any) {
        // ESRCH means process doesn't exist
        if (err.code === 'ESRCH') {
          Logger.info(`[Worker] Parent process ${this.parentPid} no longer exists, cleaning up and exiting...`);
          this.stopParentMonitor();
          this.cleanup();
          process.exit(0);
        }
      }
    }, PARENT_CHECK_INTERVAL_MS);

    // Don't let this interval keep the process alive
    this.parentCheckInterval.unref();
  }

  /**
   * Stop the parent monitoring interval
   */
  private stopParentMonitor(): void {
    if (this.parentCheckInterval) {
      clearInterval(this.parentCheckInterval);
      this.parentCheckInterval = null;
    }
  }

  private async getTunnelConfig(msg: Extract<WorkerMessage, { type: workerMessageType.GetTunnelConfig }>) {
    const { id } = msg
    const tunnelConfig = await this.getConfig();
    this.sendResponse(id, tunnelConfig);
  }

  private async getConfig(): Promise<PinggyOptionsType | null> {
    const options: PinggyOptionsType = { optional: {} };
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
const { options } = workerData;
new TunnelWorker(options);
