import { parentPort, workerData } from "worker_threads";
import { PinggyNative } from "./types.js";
import { Config } from "./bindings/config.js";
import { Tunnel } from "./bindings/tunnel.js";
import { Logger } from "./utils/logger.js";
import {
  getLastException,
  PinggyError,
  initExceptionHandling,
} from "./bindings/exception.js";
import { PinggyOptions } from "./pinggyOptions.js";
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
      const addonPath = binary.find(path.resolve(path.join(__dirname, "../package.json")));
      this.addon = require(addonPath);
      if (!this.addon) throw new Error("Failed to load native addon.");
      initExceptionHandling(this.addon);
      this.addon.setLogEnable(false);
      const options = new PinggyOptions(rawTunnelOptions);
      this.config = new Config(this.addon, options);
      if (!this.config.configRef) throw new Error("Failed to initialize config.");

      this.tunnel = new Tunnel(this.addon, this.config.configRef, options);

      // Attach native callbacks
      this.attachCallbacks();

      // Inform main thread initialization succeeded
      parentPort?.postMessage({ type: "ready" });
    } catch (e: any) {
      const pinggyError = this.convertToPinggyError(e);
      Logger.error("TunnelWorker init error:", pinggyError);
      parentPort?.postMessage({
        type: "initError",
        error: pinggyError.message,
      });
    }
  }

  /**
   * Converts any unknown error into a PinggyError (if possible)
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
    parentPort?.on("message", async (msg) => {
      if (!msg || (msg.type !== "call" && msg.type !== "registerCallback")) return;
      const { id, method, args, target } = msg;

      if (msg.type === "registerCallback") {
        this.registeredCallbacks.add(msg.event);
        return;
      }

      if (!this.tunnel) {
        this.sendResponse(id, null, "Tunnel not initialized");
        return;
      }

      try {
        const targetMethod = target === "config" ? this.config : this.tunnel;
        if (!targetMethod) throw new Error(`${msg.target} not initialized`);
        // example this.tunnel[method](args) this.tunnel[start]()

        const result = await (targetMethod as any)[method](...(args || []));

        this.sendResponse(id, result);
      } catch (err: any) {
        Logger.error("TunnelWorker method call error:", err);
        this.sendResponse(id, null, err?.message || String(err));
      }
    });

    parentPort?.on("close", () => this.cleanup());
  }

  /**
   * Relay native callbacks back to the main thread
   */
  private attachCallbacks(): void {
    if (!this.tunnel) return;

    this.tunnel.setUsageUpdateCallback((usage) => {
      if (this.registeredCallbacks.has("usageUpdate")) {
        parentPort?.postMessage({
          type: "callback",
          event: "usageUpdate",
          data: usage,
        });
      }
    });

    this.tunnel.setTunnelErrorCallback((errorNo, error, recoverable) => {
      if (this.registeredCallbacks.has("tunnelError")) {
        parentPort?.postMessage({
          type: "callback",
          event: "tunnelError",
          data: { errorNo, error, recoverable },
        });
      }
    });

    this.tunnel.setTunnelDisconnectedCallback((error, messages) => {
      if (this.registeredCallbacks.has("tunnelDisconnected")) {
        parentPort?.postMessage({
          type: "callback",
          event: "tunnelDisconnected",
          data: { error, messages },
        });
      }
    });
  }

  /**
   * Send a response back to the main thread
   */
  private sendResponse(id: number, result: any, error?: string): void {
    parentPort?.postMessage({
      type: "response",
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

}

// ======== Worker Entrypoint ======== //
const { options } = workerData;
new TunnelWorker(options);
