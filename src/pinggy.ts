import { PinggyNative } from "./types.js";
import { PinggyOptionsType, PinggyOptions } from "./pinggyOptions.js";
import { TunnelInstance } from "./tunnel-instance.js";
import { Logger, LogLevel } from "./utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * Main entry point for managing Pinggy tunnels.
 *
 * This singleton class provides methods to create, manage, and control tunnels using the Pinggy service.
 *
 * Use {@link pinggy} (the exported instance) to access these methods.
 *
 * Methods return or interact with {@link TunnelInstance} objects.
 *
 * @group Classes
 * @public
 */
export class Pinggy {
  private static _instance: Pinggy;
  private static debugEnabled = false;
  private static logFilePath: string | null = null;
  private static logLevel: LogLevel = LogLevel.INFO;
  private static addon: PinggyNative = require(path.join(__dirname, "../lib/addon.node"));
  private tunnels: Set<TunnelInstance> = new Set();

  /**
   * Private constructor for singleton pattern. Use {@link pinggy} to get the instance.
   * @internal
   */
  private constructor() { }

  /**
   * Returns the singleton instance of {@link Pinggy}.
   *
   * @returns The singleton instance.
   */
  public static get instance(): Pinggy {
    if (!this._instance) {
      this._instance = new Pinggy();
    }
    return this._instance;
  }

  /**
   * Creates a new tunnel with the given options.
   *
   * @param options - The tunnel configuration options.
   * @returns The created tunnel instance.
   * @see {@link TunnelInstance}
   * @see {@link pinggy}
   */
  public async createTunnel(options: PinggyOptionsType): Promise<TunnelInstance> {
    const pinggyOptions = new PinggyOptions(options);
    const tunnel = await TunnelInstance.create(pinggyOptions);
    this.tunnels.add(tunnel);
    // If debug was previously enabled, enable it inside this tunnel’s worker
    if (Pinggy.debugEnabled) {
      tunnel.setDebugLogging(true, Pinggy.logLevel, Pinggy.logFilePath);
    }
    return tunnel;
  }

  /**
   * Creates and starts a new tunnel with the given options.
   *
   * @param {PinggyOptionsType} options - The tunnel configuration options.
   * @returns {Promise<TunnelInstance>} Resolves with the started tunnel instance.
   * @see {@link TunnelInstance#start}
   * @see {@link pinggy}
   */
  public async forward(options: PinggyOptionsType): Promise<TunnelInstance> {
    const tunnel = await this.createTunnel(options);
    return await tunnel.start().then(() => tunnel);
  }

  /**
   * Gets all currently managed tunnel instances.
   *
   * @returns {TunnelInstance[]} Array of tunnel instances.
   * @see {@link pinggy}
   */
  public getAllTunnels(): TunnelInstance[] {
    return Array.from(this.tunnels);
  }

  /**
   * Closes and removes all managed tunnels.
   *
   * Calls {@link TunnelInstance#stop} on each tunnel.
   *
   * @returns {void}
   * @see {@link pinggy}
   */
  public async closeAllTunnels(): Promise<void> {
    for (const tunnel of this.tunnels) {
      if (await tunnel.isActive()) {
        tunnel.stop();
      }
    }
    this.tunnels.clear();
  }

  /**
   * Enable or disable debug logging for both the native library (libpinggy)
   * @param enabled - Whether to enable debug logging (default: false).
   * @param logLevel - Optional logging level to apply (default: LogLevel.INFO).
   * @param logFilePath - Optional file path to write logs to; pass null to disable file logging.
   * @returns void
   * @see {@link pinggy}
   */
  public setDebugLogging(enabled: boolean = false, logLevel?: LogLevel, logFilePath?: string | null): void {
    // enable libpinggy logs for all active tunnels
    Pinggy.debugEnabled = enabled;
    Pinggy.logFilePath = logFilePath ?? null;

    // Set debug state for JavaScript Logger
    Logger.setDebugEnabled(enabled, logFilePath);

    Pinggy.logLevel = logLevel ?? LogLevel.INFO;
    Logger.setLevel(logLevel);

    for (const tunnel of this.tunnels) {
      tunnel.setDebugLogging(enabled, logLevel, logFilePath!);
    }
  }

  /**
   * Returns the Pinggy native library version string.
   *
   * @group Functions
   * @public
   *
   * @returns {string} The version string from the native library.
   * @see {@link pinggy}
   */
  public getPinggyVersion(): string {
    try {
      return Pinggy.addon.getPinggyVersion();
    } catch (error) {
      console.warn("Failed to get Pinggy version:", error);
      return "unknown";
    }
  }
}
