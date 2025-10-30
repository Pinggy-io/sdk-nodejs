import { Logger } from "../utils/logger";
import { PinggyNative, Tunnel as ITunnel, TunnelStatus } from "../types";
import { PinggyError } from "./exception";
import { TunnelUsage } from "./tunnel-usage";
import { PinggyOptions } from "..";
import { AdditionalForwardingManager } from "../utils/additionalForwardingManager";

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
  skipInitCheck?: boolean;
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

  private readonly addon: PinggyNative;
  private readonly pinggyOptions: PinggyOptions;


  private authPromise: Promise<void>;
  private forwardingPromise: Promise<string[]> | null = null;
  private resolveAuth: (() => void) | null = null;
  private rejectAuth: ((reason?: any) => void) | null = null;
  private resolveForwarding: ((addresses: string[]) => void) | null = null;
  private rejectForwarding: ((reason?: any) => void) | null = null;
  private additionalForwardingPending: AdditionalForwardingManager = new AdditionalForwardingManager();
  private _urls: string[] = [];
  private intentionallyStopped: boolean = false; // Track intentional stops
  private functionQueue: FunctionQueue;
  private _latestUsage: TunnelUsage = new TunnelUsage();
  private webDebuggerPort: number = 0;

  // user provided callbacks
  private onUsageUpdateCallback: ((usage: TunnelUsage) => void) | null = null;
  private onTunnelErrorCallback: ((errorNo: number, error: string, recoverable: boolean) => void) | null = null;
  private onTunnelDisconnectedCallback: ((error: string, messages: string[]) => void) | null = null;
  private onAdditionalForwardingCallback: ((bindAddress: string, forwardToAddr: string, errorMessage: string | null) => void) | null = null;
  private onAuthenticatedCallback: ((messsage: string) => void) | null = null;
  private onPrimaryForwardingCallback: ((message: string, address?: string[],) => void) | null = null;

  /**
   * Creates a new Tunnel instance and initializes it with the provided config reference.
   * @param {PinggyNative} addon - The native addon instance.
   * @param {number} configRef - The reference to the native config object.
   */
  constructor(addon: PinggyNative, configRef: number, pinggyOptions: PinggyOptions) {
    this.addon = addon;
    this.tunnelRef = this.initialize(configRef);
    this.authenticated = false;
    this.primaryForwardingDone = false;
    this.status = TunnelStatus.IDLE;
    this.functionQueue = new FunctionQueue();
    this.pinggyOptions = pinggyOptions;

    // Create promise that will be resolved when authentication completes
    this.authPromise = new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;
    });
  }


  // Generic operation executor
  private executeAddonOperation<T>(config: TunnelOperationConfig<T>): T {
    if (!config.skipInitCheck) {
      this.ensureTunnelInitialized();
    }

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
    const value = this.executeAddonOperation<number>({
      operationName: "tunnelInitiate",
      operation: () => this.addon.tunnelInitiate(configRef),
      successMessage: "Tunnel initiated successfully",
      logResult: (tunnelRef) =>
        Logger.info(`Tunnel initiated with reference: ${tunnelRef}`),
      skipInitCheck: true,
    });
    return value;

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
          if (this.onAuthenticatedCallback) {
            try {
              this.onAuthenticatedCallback("Tunnel authenticated succesfully")
            } catch (error) {
              Logger.error("Error in authenticated callback", error as Error)
            }
          }
        }
      },
      {
        setter: 'tunnelSetAuthenticationFailedCallback',
        callback: (tunnelRef: number, errorMessage: string) => {
          Logger.error(`Authentication failed for tunnel ${tunnelRef}: ${errorMessage}`);
          if (this.onAuthenticatedCallback) {
            try {
              this.onAuthenticatedCallback(`Tunnel authenticated Failed:${errorMessage}`)
            } catch (error) {
              Logger.error("Error in authenticated callback", error as Error)
            }
          }
          if (this.rejectAuth) this.rejectAuth(new PinggyError("Authentication failed: " + errorMessage));

        }
      },
      {
        setter: 'tunnelSetPrimaryForwardingSucceededCallback',
        callback: (addresses: string[]) => {
          this.primaryForwardingDone = true;
          this._urls = addresses;
          if (this.resolveForwarding) this.resolveForwarding(addresses);
          if (this.onPrimaryForwardingCallback) {
            try {
              this.onPrimaryForwardingCallback("Primary forwarding succeeded", addresses)
            } catch (error) {
              Logger.error("Error in primary forwarding", error as Error)
            }
          }
        }
      },
      {
        setter: 'tunnelSetPrimaryForwardingFailedCallback',
        callback: (tunnelRef: number, errorMessage: string) => {
          Logger.error(`Primary forwarding failed for tunnel ${tunnelRef}: ${errorMessage}`);
          if (this.onPrimaryForwardingCallback) {
            try {
              this.onPrimaryForwardingCallback("Primary forwarding Failed")
            } catch (error) {
              Logger.error("Error in primary forwarding", error as Error)
            }
          }
          if (this.rejectForwarding) this.rejectForwarding(new PinggyError("Primary forwarding failed: " + errorMessage));
        }
      },
      {
        setter: 'tunnelSetAdditionalForwardingSucceededCallback',
        callback: (tunnelRef: number, bindAddr: string, forwardToAddr: string) => {
          Logger.info(`Additional forwarding succeeded for tunnel ${tunnelRef}: ${bindAddr} -> ${forwardToAddr}`);
          // Resolve the oldest pending promise for this bindAddr (remote) + forwardToAddr (local)
          this.additionalForwardingPending.resolveOne(bindAddr, forwardToAddr);
          if (this.onAdditionalForwardingCallback) {
            try {
              this.onAdditionalForwardingCallback(bindAddr, forwardToAddr, null);
            } catch (error) {
              Logger.error("Error in additionalforwardingCallback", error as Error);
            }
          }
        }
      },
      {
        setter: 'tunnelSetAdditionalForwardingFailedCallback',
        callback: (tunnelRef: number, bindAddress: string, forwardToAddr: string, errorMessage: string) => {
          Logger.error(`Additional forwarding failed for ${bindAddress} -> ${forwardToAddr} on tunnel ${tunnelRef}: ${errorMessage}`);
          // Reject the oldest pending promise for this bindAddress (remote) + forwardToAddr (local)
          this.additionalForwardingPending.rejectOne(
            bindAddress,
            forwardToAddr,
            new PinggyError(`Additional forwarding failed for ${bindAddress} -> ${forwardToAddr}: ${errorMessage}`)
          );
          if (this.onAdditionalForwardingCallback) {
            try {
              this.onAdditionalForwardingCallback(bindAddress, forwardToAddr, errorMessage);
            } catch (error) {
              Logger.error("Error in additionalforwardingCallback", error as Error);
            }
          }
        }
      },
      {
        setter: 'tunnelSetOnDisconnectedCallback',
        callback: (tunnelRef: number, error: string, messages: string[]) => {
          Logger.info(`Tunnel disconnected: error: ${error}`);
          // Clear any pending additional forwarding promises since tunnel is disconnected
          try {
            this.additionalForwardingPending.clearAll(new PinggyError(`Tunnel disconnected: ${error}`));
          } catch (e) {
            // ignore
          }
          if (this.onTunnelDisconnectedCallback) {
            try {
              this.onTunnelDisconnectedCallback(error, messages);
            } catch (cbErr) {
              Logger.error("Error in onTunnelDisconnectedCallback:", cbErr as Error);
            }
          }
        }
      },
      {
        setter: 'tunnelSetOnTunnelErrorCallback',
        callback: (tunnelRef: number, errorNo: number, error: string, recoverable: boolean) => {
          Logger.error(`Tunnel error on  (${errorNo}): ${error} (recoverable: ${recoverable})`);
          // notify client callback if provided
          if (this.onTunnelErrorCallback) {
            try {
              this.onTunnelErrorCallback(errorNo, error, recoverable);
            } catch (cbErr) {
              Logger.error("Error in onTunnelErrorCallback:", cbErr as Error);
            }
          }
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
    return this.executeAddonOperation({
      operation: async () => {
        this.status = TunnelStatus.STARTING;

        // Setup all callbacks
        this.setupCallbacks();

        // Create forwarding promise for primary forwarding and wire its resolvers
        this.forwardingPromise = new Promise<string[]>((resolve, reject) => {
          this.resolveForwarding = resolve;
          this.rejectForwarding = reject;
        });

        const connected = this.addon.tunnelConnect(this.tunnelRef);
        if (!connected) {
          throw new Error("Tunnel connection failed.");
        }

        Logger.info("Tunnel connected, starting authentication monitoring...");
        this.pollStart();

        // Wait for forwarding to complete and return the addresses
        const urls = await (this.forwardingPromise as Promise<string[]>);

        // Auto-start web debugger if configured
        if (this.pinggyOptions.webDebugger) {
          try {
            const debuggerAddress = this.pinggyOptions.webDebugger;
            // Extract port from address (format like "localhost:8080")
            const portMatch = debuggerAddress.match(/:(\d+)$/);
            if (portMatch) {
              const port = parseInt(portMatch[1], 10);
              Logger.info(`Auto-starting web debugger on port ${port}...`);
              await this.startWebDebugging(port);
            } else {
              Logger.info(`Invalid web debugger address format: ${debuggerAddress}. Expected format: host:port`);
            }
          } catch (error) {
            Logger.error("Failed to auto-start web debugger:", error as Error);
            // Don't throw - web debugger failure shouldn't stop the tunnel
          }
        }

        return urls;
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
        const ret = this.addon.tunnelResumeWithTimeout(this.tunnelRef, 100);
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

    this.executeAddonOperation({
      operation: () => {
        const port = this.addon.tunnelStartWebDebugging(this.tunnelRef, listeningPort);
        if (port && port > 0) {
          this.webDebuggerPort = port;
        }
      },
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
    // Wait for primary forwarding to complete
    await this.forwardingPromise;

    // Enqueue a pending promise for this remote/local pair 
    const { promise } = this.additionalForwardingPending.enqueue(remoteAddress, localAddress);

    this.executeAddonOperation({
      operation: () => this.addon.tunnelRequestAdditionalForwarding(this.tunnelRef, remoteAddress, localAddress),
      operationName: "requesting additional forwarding",
      successMessage: `Requested additional forwarding from ${remoteAddress} to ${localAddress}`
    });

    return promise;
  }

  /**
   * Stops the tunnel and cleans up resources.
   * @returns {boolean} True if the tunnel was stopped successfully, false otherwise.
   * @throws {PinggyError|Error} If stopping the tunnel fails.
   */
  public tunnelStop(): boolean {
    return this.executeAddonOperation<boolean>({
      operationName: "stopping tunnel",
      operation: () => {
        // Mark as intentionally stopped and update status before calling native stop
        this.intentionallyStopped = true;
        this.status = TunnelStatus.CLOSED;
        return this.addon.tunnelStop(this.tunnelRef);
      },
      logResult: (result) => {
        if (result) {
          Logger.info("Tunnel stopped successfully.");
        } else {
          Logger.error("Failed to stop tunnel.");
        }
      },
      defaultValue: false,
    });
  }

  /**
   * Checks if the tunnel is currently active.
   * @returns {boolean} True if the tunnel is active, false otherwise.
   */
  public tunnelIsActive(): boolean {
    return this.executeAddonOperation({
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

  public getTunnelGreetMessage(): string[] {
    return this.executeAddonOperation({
      operation: () => {
        const raw = this.addon.getTunnelGreetMessage(this.tunnelRef);
        if (!raw) return [];
        try {
          const parsedGreetMsg = JSON.parse(raw);

          return parsedGreetMsg;
        } catch (e) {
          return [];
        }
      },
      operationName: "getting tunnel greet message",
      logResult: (message) => Logger.info(`Tunnel greet message: ${message}`),
    });
  }

  public startTunnelUsageUpdate(): void {
    this.executeAddonOperation({
      operation: () => this.addon.startTunnelUsageUpdate(this.tunnelRef),
      operationName: "starting tunnel usage update",
      successMessage: `Started tunnel usage update for tunnel ${this.tunnelRef}`
    });
  }

  public stopTunnelUsageUpdate(): void {
    this.executeAddonOperation({
      operation: () => this.addon.stopTunnelUsageUpdate(this.tunnelRef),
      operationName: "stopping tunnel usage update",
      successMessage: `Stopped tunnel usage update for tunnel ${this.tunnelRef}`
    });
  }

  public getTunnelUsages(): string {
    return this.executeAddonOperation({
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

  public getWebDebuggerPort(): number | null {
    return this.webDebuggerPort;
  }

  public setTunnelErrorCallback(callback: (errorNo: number, error: string, recoverable: boolean) => void): void {
    this.onTunnelErrorCallback = callback;
  }

  public setTunnelDisconnectedCallback(callback: (error: string, messages: string[]) => void): void {
    this.onTunnelDisconnectedCallback = callback;
  }

  public setAdditionalForwardingCallback(callback: (bindAddress: string, forwardToAddr: string, errorMessage: string | null) => void): void {
    this.onAdditionalForwardingCallback = callback;
  }

  public setAuthenticatedCallback(callback: (message: string) => void) {
    this.onAuthenticatedCallback = callback;
  }

  public setPrimaryForwardingCallback(callback: (message: string, address?: string[]) => void) {
    this.onPrimaryForwardingCallback = callback;
  }

  public getStatus(): TunnelStatus {
    return this.status;
  }
}
