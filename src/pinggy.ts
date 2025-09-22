import { PinggyNative } from "./types";
import { PinggyOptionsType, PinggyOptions } from "./pinggyOptions";
import { TunnelInstance } from "./tunnel-instance";
import { Logger } from "./utils/logger";
const binary = require("@mapbox/node-pre-gyp");
const path = require("path");

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
  private static addon: PinggyNative = require(binary.find(
    path.resolve(path.join(__dirname, "../package.json"))
  ));
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
  public createTunnel(options: PinggyOptionsType): TunnelInstance {
    const pinggyOptions = new PinggyOptions(options);
    const tunnel = new TunnelInstance(Pinggy.addon, pinggyOptions);
    this.tunnels.add(tunnel);
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
  public forward(options: PinggyOptionsType): Promise<TunnelInstance> {
    const tunnel = this.createTunnel(options);
    return tunnel.start().then(() => tunnel);
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
  public closeAllTunnels(): void {
    for (const tunnel of this.tunnels) {
      if (tunnel.isActive()) {
        tunnel.stop();
      }
    }
    this.tunnels.clear();
  }

  /**
   * Enables or disables debug logging for both native and JavaScript code.
   *
   * @param {boolean} enabled - Whether to enable debug logging.
   * @returns {void}
   * @see {@link pinggy}
   */
  public setDebugLogging(enabled: boolean = false): void {
    // enable libpinggy logs
    Pinggy.addon.setLogEnable(enabled);

    // Set debug state for native C code
    Pinggy.addon.setDebugLogging(enabled);

    // Set debug state for JavaScript Logger
    Logger.setDebugEnabled(enabled);
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
