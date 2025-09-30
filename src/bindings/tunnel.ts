import { Logger } from "../utils/logger";
import { PinggyNative, Tunnel as ITunnel, TunnelStatus } from "../types";
import { PinggyError } from "./exception";
import { TunnelUsage } from "./tunnel-usage";

type Task = () => void;
class FunctionQueue {
  private queue: Task[] = [];

  enqueue(task: Task): void {
    this.queue.push(task);
  }

  dequeueAndRun(): void {
    if (this.queue.length === 0) {
      return;
    }
    const nextTask = this.queue.shift();
    if (nextTask) {
      nextTask();
    }
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}

interface TunnelOperationConfig<T> {
  operation: () => T;
  operationName: string;
  successMessage?: string;
  defaultValue?: T;
  logResult?: (result: T) => void;
}


/**
 * Represents a Pinggy tunnel instance, managing its lifecycle and forwarding.
 * Handles authentication, forwarding, and additional tunnel operations via the native addon.
 * Implements the Tunnel interface.
 *
 * @group Classes
 * @public
 */
export class Tunnel implements ITunnel {
  /** Reference to the native tunnel object. */
  public tunnelRef: number;
  /** Whether the tunnel is authenticated. */
  public authenticated: boolean;
  /** Whether primary forwarding is complete. */
  public primaryForwardingDone: boolean;
  /** Current status of the tunnel. */
  public status: TunnelStatus;
  private addon: PinggyNative;
  private authPromise: Promise<void>;
  private forwardingPromise: Promise<string[]>;
  private additionalForwardingPromise: Promise<void>;
  private resolveAuth: (() => void) | null = null;
  private rejectAuth: ((reason?: any) => void) | null = null;
  private resolveForwarding: ((addresses: string[]) => void) | null = null;
  private rejectForwarding: ((reason?: any) => void) | null = null;
  private resolveAdditionalForwarding: (() => void) | null = null;
  private rejectAdditionalForwarding: ((reason?: any) => void) | null = null;
  private _urls: string[] = [];
  private intentionallyStopped: boolean = false; // Track intentional stops
  private functionQueue: FunctionQueue;
  private _latestUsage: TunnelUsage = new TunnelUsage();
  private onUsageUpdateCallback: ((usage: TunnelUsage) => void) | null = null;

  /**
   * Creates a new Tunnel instance and initializes it with the provided config reference.
   * @param {PinggyNative} addon - The native addon instance.
   * @param {number} configRef - The reference to the native config object.
   */
  constructor(addon: PinggyNative, configRef: number) {
    this.addon = addon;
    this.tunnelRef = this.initialize(configRef);
    this.authenticated = false;
    this.primaryForwardingDone = false;
    this.status = TunnelStatus.IDLE;
    this.functionQueue = new FunctionQueue();

    // Create promises that will be resolved when authentication and forwarding complete
    this.authPromise = new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;
    });

    this.forwardingPromise = new Promise((resolve, reject) => {
      this.resolveForwarding = resolve;
      this.rejectForwarding = reject;
    });

    this.additionalForwardingPromise = new Promise((resolve, reject) => {
      this.resolveAdditionalForwarding = resolve;
      this.rejectAdditionalForwarding = reject;
    });
  }


  // Generic operation executor
  private executeTunnelOperation<T>(config: TunnelOperationConfig<T>): T {
    this.ensureTunnelInitialized();

    const result = config.operation();

    // Always check addon’s last exception after the call
    const lastEx = this.addon.getLastException();
    if (
      lastEx !== null &&
      lastEx !== undefined &&
      !(typeof lastEx === "string" && lastEx.trim().length === 0)
    ) {
      const pinggyError = new PinggyError(lastEx as any);
      Logger.error(`Error ${config.operationName}:`, pinggyError);
      throw pinggyError;
    }

    if (config.successMessage) {
      Logger.info(config.successMessage);
    }

    if (config.logResult) {
      config.logResult(result);
    }
    return result;
  }

  private initialize(configRef: number): number {
    try {
      const tunnelRef = this.addon.tunnelInitiate(configRef);
      Logger.info(`Tunnel initiated with reference: ${tunnelRef}`);
      return tunnelRef;
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error initiating tunnel:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error initiating tunnel:", e as Error);
        return 0;
      }
    }
  }
  private ensureTunnelInitialized(): void {
    if (!this.tunnelRef) {
      throw new Error("Tunnel not initialized.");
    }
  }

  private setupCallbacks(): void {
    const callbackConfigs = [
      {
        setter: 'tunnelSetAuthenticatedCallback',
        callback: () => {
          Logger.info("Tunnel authenticated, requesting primary forwarding...");
          this.authenticated = true;
          if (this.resolveAuth) this.resolveAuth();
          this.functionQueue.enqueue(() => {
            this.addon.tunnelRequestPrimaryForwarding(this.tunnelRef);
          });
        }
      },
      {
        setter: 'tunnelSetAuthenticationFailedCallback',
        callback: (tunnelRef: number, errorMessage: string) => {
          Logger.error(`Authentication failed for tunnel ${tunnelRef}: ${errorMessage}`);
          if (this.rejectAuth) this.rejectAuth(new PinggyError("Authentication failed: " + errorMessage));
        }
      },
      {
        setter: 'tunnelSetPrimaryForwardingSucceededCallback',
        callback: (addresses: string[]) => {
          this.primaryForwardingDone = true;
          this._urls = addresses;
          if (this.resolveForwarding) this.resolveForwarding(addresses);
        }
      },
      {
        setter: 'tunnelSetPrimaryForwardingFailedCallback',
        callback: (tunnelRef: number, errorMessage: string) => {
          Logger.error(`Primary forwarding failed for tunnel ${tunnelRef}: ${errorMessage}`);
          if (this.rejectForwarding) this.rejectForwarding(new PinggyError("Primary forwarding failed: " + errorMessage));
        }
      },
      {
        setter: 'tunnelSetAdditionalForwardingSucceededCallback',
        callback: (tunnelRef: number, bindAddr: string, forwardToAddr: string, protocol: string) => {
          Logger.info(`Additional forwarding succeeded for tunnel ${tunnelRef}: ${bindAddr} -> ${forwardToAddr} (${protocol})`);
          if (this.resolveAdditionalForwarding) this.resolveAdditionalForwarding();
        }
      },
      {
        setter: 'tunnelSetAdditionalForwardingFailedCallback',
        callback: (tunnelRef: number, remoteAddress: string, errorMessage: string) => {
          Logger.error(`Additional forwarding failed for ${remoteAddress} on tunnel ${tunnelRef}: ${errorMessage}`);
          if (this.rejectAdditionalForwarding) this.rejectAdditionalForwarding(new PinggyError(`Additional forwarding failed: ${remoteAddress} - ${errorMessage}`));
        }
      },
      {
        setter: 'tunnelSetOnDisconnectedCallback',
        callback: (tunnelRef: number, error: string, messages: string[]) => {
          Logger.info(`Tunnel disconnected: ${tunnelRef}, error: ${error}`);
          if (messages && messages.length > 0) {
            Logger.info(`Disconnection messages: ${messages.join(", ")}`);
          }
        }
      },
      {
        setter: 'tunnelSetOnTunnelErrorCallback',
        callback: (tunnelRef: number, errorNo: number, error: string, recoverable: boolean) => {
          Logger.error(`Tunnel error on ${tunnelRef} (${errorNo}): ${error} (recoverable: ${recoverable})`);
        }
      },
      {
        setter: 'tunnelSetOnUsageUpdateCallback',
        callback: (tunnelRef: number, usageJson: string) => {
          this.handleUsageUpdate(usageJson);
        }
      }
    ];

    // Set all callbacks
    callbackConfigs.forEach(({ setter, callback }) => {
      (this.addon as any)[setter](this.tunnelRef, callback);
    });
  }

  private handleUsageUpdate(usageJson: string): void {
    if (!usageJson) {
      // Debug log
      return;
    }

    try {
      this._latestUsage.updateFromJSON(usageJson);
      if (this.onUsageUpdateCallback) {
        this.onUsageUpdateCallback(this._latestUsage);
      }
    } catch (err) {
      // Todo Debug log
    }
  }

  /**
   * Starts the tunnel, handles authentication and forwarding, and returns the public URLs.
   * @returns {Promise<string[]>} Resolves with the list of public tunnel URLs.
   * @throws {PinggyError|Error} If tunnel connection or forwarding fails.
   */
  public async start(): Promise<string[]> {
    return this.executeTunnelOperation({
      operation: async () => {
        this.status = TunnelStatus.STARTING;

        // Setup all callbacks
        this.setupCallbacks();

        const connected = this.addon.tunnelConnect(this.tunnelRef);
        if (!connected) {
          throw new Error("Tunnel connection failed.");
        }

        Logger.info("Tunnel connected, starting authentication monitoring...");
        this.pollStart();

        // Wait for forwarding to complete and return the addresses
        return await this.forwardingPromise;
      },
      operationName: "starting tunnel",

    });
  }

  private pollStart(): void {
    // A simple sync-style poll that schedules itself only on success:
    const poll = (): void => {
      // Check if tunnel was intentionally stopped
      if (this.intentionallyStopped) {
        return; // STOP polling silently
      }

      let shouldContinue: boolean;
      try {
        // tunnelResume returns boolean
        const ret = this.addon.tunnelResume(this.tunnelRef);
        if (!ret) {
          // Only log error if tunnel was not intentionally stopped
          if (!this.intentionallyStopped) {
            Logger.error("Tunnel error detected, stopping polling.");
          }
          this.status = TunnelStatus.CLOSED;
          return; // STOP polling
        }
        if (this.status === TunnelStatus.STARTING) {
          this.status = TunnelStatus.LIVE;
        }
        this.functionQueue.dequeueAndRun();
        shouldContinue = true;
      } catch (e) {
        this.status = TunnelStatus.CLOSED;

        // Only log errors if tunnel was not intentionally stopped
        if (!this.intentionallyStopped) {
          const lastEx = this.addon.getLastException();
          if (lastEx) {
            const pinggyError = new PinggyError(lastEx);
            Logger.error("Error during tunnel polling:", pinggyError);
          } else {
            Logger.error("Error during tunnel polling:", e as Error);
          }
        }
        return; // STOP polling
      }

      // only schedule next poll if no error and not intentionally stopped
      if (shouldContinue && !this.intentionallyStopped) {
        // use setImmediate to avoid blowing the stack
        setImmediate(poll);
      }
    };

    // kick it off
    poll();
  }

  /**
   * Starts web debugging for the tunnel on the specified local port.
   * @param {number} listeningPort - The local port to start web debugging on.
   * @returns {Promise<void>} Resolves when web debugging is started.
   * @throws {PinggyError|Error} If web debugging fails to start.
   */
  public async startWebDebugging(listeningPort: number): Promise<void> {
    await this.authPromise; // Wait for authentication

    this.executeTunnelOperation({
      operation: () => this.addon.tunnelStartWebDebugging(this.tunnelRef, listeningPort),
      operationName: "starting web debugging",
      successMessage: `Web debugging started on port ${listeningPort} visit http://localhost:${listeningPort}`
    });
  }

  /**
   * Requests additional forwarding for the tunnel.
   * @param {string} remoteAddress - The remote address to forward from.
   * @param {string} localAddress - The local address to forward to.
   * @returns {Promise<void>} Resolves when additional forwarding is set up.
   * @throws {PinggyError|Error} If additional forwarding fails.
   */
  public async tunnelRequestAdditionalForwarding(
    remoteAddress: string,
    localAddress: string
  ): Promise<void> {
    await this.forwardingPromise; // Wait for primary forwarding to complete

    this.executeTunnelOperation({
      operation: () => this.addon.tunnelRequestAdditionalForwarding(this.tunnelRef, remoteAddress, localAddress),
      operationName: "requesting additional forwarding",
      successMessage: `Requested additional forwarding from ${remoteAddress} to ${localAddress}`
    });
  }

  /**
   * Stops the tunnel and cleans up resources.
   * @returns {boolean} True if the tunnel was stopped successfully, false otherwise.
   * @throws {PinggyError|Error} If stopping the tunnel fails.
   */
  public tunnelStop(): boolean {
    this.ensureTunnelInitialized();
    try {
      // Mark as intentionally stopped before calling native stop
      this.intentionallyStopped = true;
      this.status = TunnelStatus.CLOSED;

      const result = this.addon.tunnelStop(this.tunnelRef);
      if (result) {
        Logger.info("Tunnel stopped successfully.");
      } else {
        Logger.error("Failed to stop tunnel.");
      }
      return result;
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error stopping tunnel:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error stopping tunnel:", e as Error);
        return false;
      }
    }
  }

  /**
   * Checks if the tunnel is currently active.
   * @returns {boolean} True if the tunnel is active, false otherwise.
   */
  public tunnelIsActive(): boolean {
    return this.executeTunnelOperation({
      operation: () => this.addon.tunnelIsActive(this.tunnelRef),
      operationName: "checking tunnel active status",
      logResult: (result) => Logger.info(`Tunnel active status: ${result}`),
      defaultValue: false,
    });
  }

  /**
   * Gets the list of public URLs for the tunnel.
   * @returns {string[]} The list of public tunnel URLs.
   */
  public getUrls(): string[] {
    return this._urls;
  }

  public getTunnelGreetMessage(): string | null {
    return this.executeTunnelOperation({
      operation: () => {
        const raw = this.addon.getTunnelGreetMessage(this.tunnelRef);
        if (!raw) return null;
        try {
          const parsedGreetMsg = JSON.parse(raw);

          return parsedGreetMsg.join(" ");
        } catch (e) {
          return null;
        }
      },
      operationName: "getting tunnel greet message",
      logResult: (message) => Logger.info(`Tunnel greet message: ${message}`),
    });
  }

  public startTunnelUsageUpdate(): void {
    this.executeTunnelOperation({
      operation: () => this.addon.startTunnelUsageUpdate(this.tunnelRef),
      operationName: "starting tunnel usage update",
      successMessage: `Started tunnel usage update for tunnel ${this.tunnelRef}`
    });
  }

  public stopTunnelUsageUpdate(): void {
    this.executeTunnelOperation({
      operation: () => this.addon.stopTunnelUsageUpdate(this.tunnelRef),
      operationName: "stopping tunnel usage update",
      successMessage: `Stopped tunnel usage update for tunnel ${this.tunnelRef}`
    });
  }

  public getTunnelUsages(): string {
    return this.executeTunnelOperation({
      operation: () => this.addon.getTunnelUsages(this.tunnelRef),
      operationName: "getting tunnel usages",
      logResult: (usages) => Logger.info(`Tunnel usages for ${this.tunnelRef}: ${usages}`),
      defaultValue: "",
    });
  }

  public getLatestUsage(): TunnelUsage | null {
    if (!this.tunnelRef) return null;
    return this._latestUsage;
  }

  public setUsageUpdateCallback(callback: (usage: TunnelUsage) => void): void {
    this.onUsageUpdateCallback = callback;
    this.startTunnelUsageUpdate();
  }
}
