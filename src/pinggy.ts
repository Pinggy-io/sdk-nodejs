import { PinggyNative } from "./types.js";
import { TunnelConfigurationV1, TunnelConfiguration } from "./tunnelConfiguration.js";
import { TunnelInstance } from "./tunnel-instance.js";
import { Logger, LogLevel } from "./utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import crypto from "crypto";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// When packaged with pkg on Windows, addon.node is extracted to a tmp cache dir but
// pinggy.dll is not. Windows DLL loading searches relative to addon.node's location,
// so both files must live in the same directory. We handle this by extracting them
// ourselves into a stable temp dir keyed by the addon's content hash.
function loadAddon(): PinggyNative {
  const addonPath = path.join(__dirname, "../lib/addon.node");
  const isPkgWindows = process.platform === "win32" && !!(process as any).pkg;

  if (!isPkgWindows) return require(addonPath);

  const addonBytes = fs.readFileSync(addonPath);
  const hash = crypto.createHash("sha256").update(addonBytes).digest("hex").slice(0, 16);
  const extractDir = path.join(os.tmpdir(), "pinggy-native", hash);
  fs.mkdirSync(extractDir, { recursive: true });

  const files = ["addon.node", "pinggy.dll"] as const;
  const sources = [addonBytes, fs.readFileSync(path.join(__dirname, "../lib/pinggy.dll"))];

  files.forEach((file, i) => {
    const dest = path.join(extractDir, file);
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, sources[i]);
  });

  return require(path.join(extractDir, "addon.node"));
}

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
  private static addon: PinggyNative = loadAddon();
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
  public async createTunnel(options: TunnelConfigurationV1): Promise<TunnelInstance> {
    const pinggyOptions = new TunnelConfiguration(options);

    const tunnel = await TunnelInstance.create(pinggyOptions, {
      enabled: Pinggy.debugEnabled,
      logLevel: Pinggy.logLevel,
      logFilePath: Pinggy.logFilePath,
    });

    this.tunnels.add(tunnel);
    return tunnel;
  }

  /**
   * Creates and starts a new tunnel with the given options.
   *
   * @param {TunnelConfigurationV1} options - The tunnel configuration options.
   * @returns {Promise<TunnelInstance>} Resolves with the started tunnel instance.
   * @see {@link TunnelInstance#start}
   * @see {@link pinggy}
   */
  public async forward(options: TunnelConfigurationV1): Promise<TunnelInstance> {
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
    Logger.setDebugEnabled(enabled, Pinggy.logFilePath);

    Pinggy.logLevel = logLevel ?? LogLevel.INFO;
    Logger.setLevel(Pinggy.logLevel);

    for (const tunnel of this.tunnels) {
      tunnel.setDebugLogging(enabled, Pinggy.logLevel, Pinggy.logFilePath);
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
