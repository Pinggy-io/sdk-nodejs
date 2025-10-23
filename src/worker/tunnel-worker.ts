import { parentPort, workerData } from "worker_threads";
import { PinggyNative, WorkerMessages, workerMessageType } from "../types.js";
import { Config } from "../bindings/config.js";
import { Tunnel } from "../bindings/tunnel.js";
import { Logger } from "../utils/logger.js";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "../bindings/exception.js";
import { PinggyOptions } from "../pinggyOptions.js";
const binary = require("@mapbox/node-pre-gyp");
const path = require("path");


class TunnelWorker {
  private addon: PinggyNative | null = null;
  private config: Config | null = null;
  private tunnel: Tunnel | null = null;
  private registeredCallbacks: Set<string> = new Set();

  constructor(rawTunnelOptions: any) {
    this.initialize(rawTunnelOptions);
    this.registerMessageHandlers();
  }

  /**
   * Initialize native addon, config, and tunnel
   */
  private initialize(rawTunnelOptions: any): void {
    try {
      const addonPath = binary.find(path.resolve(path.join(__dirname, "../../package.json")));
      this.addon = require(addonPath);
      if (!this.addon) throw new Error("Failed to load native addon.");

      initExceptionHandling(this.addon);
      this.addon.setLogEnable(false);

      const options = new PinggyOptions(rawTunnelOptions);
      this.config = new Config(this.addon, options);

      if (!this.config.configRef) throw new Error("Failed to initialize config.");

      this.tunnel = new Tunnel(this.addon, this.config.configRef, options);

      if (!this.tunnel) throw new Error("Failed to initialize tunnel.")

      // Attach native callbacks
      this.attachCallbacks();

      // Inform main thread initialization succeeded
      this.postMessage({ type: workerMessageType.Ready });
    } catch (e: any) {

      const pinggyError = this.convertToPinggyError(e);
      Logger.error("TunnelWorker init error:", pinggyError);
      this.postMessage({
        type: workerMessageType.InitError,
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
    parentPort?.on("message", async (msg: WorkerMessages) => {
      if (!msg || typeof msg !== "object") {
        Logger.info(`Ignoring malformed message: ${JSON.stringify(msg)}`);
        return;
      }

      switch (msg.type) {
        case workerMessageType.RegisterCallback:
          this.registeredCallbacks.add(msg.event);
          Logger.info(`Registered callback: ${msg.event}`);
          return;

        case workerMessageType.Call:
          await this.handleMainThreadCall(msg);
          return;
          
        case workerMessageType.enableLogger:
          this.setDebugLogging(msg.enabled);
          return

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

  private async handleMainThreadCall(msg: Extract<WorkerMessages, { type: workerMessageType.Call }>) {
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
      usageUpdate: (usage: any) =>
        this.forwardCallback("usageUpdate", usage),
      tunnelError: (errorNo: number, error: string, recoverable: boolean) =>
        this.forwardCallback("tunnelError", { errorNo, error, recoverable }),
      tunnelDisconnected: (error: string, messages: string[]) =>
        this.forwardCallback("tunnelDisconnected", { error, messages }),
    };

    this.tunnel.setUsageUpdateCallback(callbacks.usageUpdate);
    this.tunnel.setTunnelErrorCallback(callbacks.tunnelError);
    this.tunnel.setTunnelDisconnectedCallback(callbacks.tunnelDisconnected);
  }

  /**
   * Send a callback event to the main thread only if registered.
   */
  private forwardCallback(event: string, data: any) {
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
    this.tunnel = null;
    this.config = null;
    this.addon = null;
  }

  /**
   * Post a message safely to the main thread.
   */
  private postMessage(msg: WorkerMessages): void {
    if (!parentPort) {
      Logger.error("Cannot post message: parentPort is null");
      return;
    }
    parentPort.postMessage(msg);
  }

  private setDebugLogging(enabled: boolean = false): void {
    this.addon?.setLogEnable(enabled)
    this.addon?.setDebugLogging(enabled)
  }

}

// ======== Worker Entrypoint ======== //
const { options } = workerData;
new TunnelWorker(options);
