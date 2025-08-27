import { Logger } from "../utils/logger";
import { PinggyNative, Tunnel as ITunnel, TunnelStatus } from "../types";
import { PinggyError } from "./exception";

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

  /**
   * Starts the tunnel, handles authentication and forwarding, and returns the public URLs.
   * @returns {Promise<string[]>} Resolves with the list of public tunnel URLs.
   * @throws {PinggyError|Error} If tunnel connection or forwarding fails.
   */
  public async start(): Promise<string[]> {
    if (!this.tunnelRef) {
      throw new Error("Tunnel not initialized.");
    }

    try {
      this.status = TunnelStatus.STARTING;
      this.addon.tunnelSetAuthenticatedCallback(this.tunnelRef, () => {
        Logger.info("Tunnel authenticated, requesting primary forwarding...");
        this.authenticated = true;
        if (this.resolveAuth) {
          this.resolveAuth();
        }
        this.addon.tunnelRequestPrimaryForwarding(this.tunnelRef);
      });

      this.addon.tunnelSetAuthenticationFailedCallback(
        this.tunnelRef,
        (tunnelRef, errorMessage) => {
          Logger.error(
            `Authentication failed for tunnel ${tunnelRef}: ${errorMessage}`
          );
          if (this.rejectAuth)
            this.rejectAuth(
              new PinggyError("Authentication failed: " + errorMessage)
            );
        }
      );

      this.addon.tunnelSetPrimaryForwardingSucceededCallback(
        this.tunnelRef,
        (addresses) => {
          this.primaryForwardingDone = true;
          this._urls = addresses;
          if (this.resolveForwarding) {
            this.resolveForwarding(addresses);
          }
        }
      );

      this.addon.tunnelSetPrimaryForwardingFailedCallback(
        this.tunnelRef,
        (tunnelRef: number, errorMessage: string) => {
          Logger.error(
            `Primary forwarding failed for tunnel ${tunnelRef}: ${errorMessage}`
          );
          if (this.rejectForwarding) {
            this.rejectForwarding(
              new PinggyError("Primary forwarding failed: " + errorMessage)
            );
          }
        }
      );

      this.addon.tunnelSetAdditionalForwardingSucceededCallback(
        this.tunnelRef,
        (
          tunnelRef: number,
          bindAddr: string,
          forwardToAddr: string,
          protocol: string
        ) => {
          Logger.info(
            `Additional forwarding succeeded for tunnel ${tunnelRef}: ${bindAddr} -> ${forwardToAddr} (${protocol})`
          );
          if (this.resolveAdditionalForwarding) {
            this.resolveAdditionalForwarding();
          }
        }
      );

      this.addon.tunnelSetAdditionalForwardingFailedCallback(
        this.tunnelRef,
        (tunnelRef: number, remoteAddress: string, errorMessage: string) => {
          Logger.error(
            `Additional forwarding failed for ${remoteAddress} on tunnel ${tunnelRef}: ${errorMessage}`
          );
          if (this.rejectAdditionalForwarding) {
            this.rejectAdditionalForwarding(
              new PinggyError(
                `Additional forwarding failed: ${remoteAddress} - ${errorMessage}`
              )
            );
          }
        }
      );

      this.addon.tunnelSetOnDisconnectedCallback(
        this.tunnelRef,
        (tunnelRef: number, error: string, messages: string[]) => {
          Logger.info(`Tunnel disconnected: ${tunnelRef}, error: ${error}`);
          if (messages && messages.length > 0) {
            Logger.info(`Disconnection messages: ${messages.join(", ")}`);
          }
        }
      );

      this.addon.tunnelSetOnTunnelErrorCallback(
        this.tunnelRef,
        (
          tunnelRef: number,
          errorNo: number,
          error: string,
          recoverable: boolean
        ) => {
          Logger.error(
            `Tunnel error on ${tunnelRef} (${errorNo}): ${error} (recoverable: ${recoverable})`
          );
        }
      );

      this.addon.tunnelSetOnUsageUpdateCallback(
        this.tunnelRef,
        (tunnelRef: number, usages: string) => {
          Logger.info(`Usage update for tunnel ${tunnelRef}: ${usages}`);
          // Here we could emit an event for the user to listen to.
          // For now, just logging.
        }
      );

      const connected = this.addon.tunnelConnect(this.tunnelRef);
      if (!connected) {
        throw new Error("Tunnel connection failed.");
      }
      Logger.info("Tunnel connected, starting authentication monitoring...");

      this.pollStart();

      // Wait for forwarding to complete and return the addresses
      return await this.forwardingPromise;
    } catch (error) {
      this.status = TunnelStatus.CLOSED;
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error in startTunnel:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error in startTunnel:", error as Error);
        throw error;
      }
    }
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
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }

    try {
      await this.authPromise; // Wait for authentication
      this.addon.tunnelStartWebDebugging(this.tunnelRef, listeningPort);
      Logger.info(
        `Web debugging started on port ${listeningPort} visit http://localhost:${listeningPort}`
      );
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error starting web debugging:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error starting web debugging:", e as Error);
      }
    }
  }

  /**
   * Starts continuous usage updates for the tunnel.
   * The `onUsageUpdate` callback will be triggered with usage data.
   * @returns {Promise<void>} Resolves when usage updates are started.
   * @throws {PinggyError|Error} If starting usage updates fails.
   */
  public async startUsageUpdate(): Promise<void> {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }
    try {
      await this.authPromise; // Wait for authentication
      this.addon.tunnelStartUsageUpdate(this.tunnelRef);
      Logger.info("Started continuous usage updates.");
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error starting usage updates:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error starting usage updates:", e as Error);
        throw e;
      }
    }
  }

  /**
   * Stops continuous usage updates for the tunnel.
   * @returns {Promise<void>} Resolves when usage updates are stopped.
   * @throws {PinggyError|Error} If stopping usage updates fails.
   */
  public async stopUsageUpdate(): Promise<void> {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }
    try {
      await this.authPromise; // Wait for authentication
      this.addon.tunnelStopUsageUpdate(this.tunnelRef);
      Logger.info("Stopped continuous usage updates.");
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error stopping usage updates:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error stopping usage updates:", e as Error);
        throw e;
      }
    }
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
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }

    try {
      await this.additionalForwardingPromise; // Wait for primary forwarding to complete
      this.addon.tunnelRequestAdditionalForwarding(
        this.tunnelRef,
        remoteAddress,
        localAddress
      );
      Logger.info(
        `Requested additional forwarding from ${remoteAddress} to ${localAddress}`
      );
    } catch (e) {
      const lastEx = this.addon.getLastException();
      if (lastEx) {
        const pinggyError = new PinggyError(lastEx);
        Logger.error("Error requesting additional forwarding:", pinggyError);
        throw pinggyError;
      } else {
        Logger.error("Error requesting additional forwarding:", e as Error);
      }
    }
  }

  /**
   * Stops the tunnel and cleans up resources.
   * @returns {boolean} True if the tunnel was stopped successfully, false otherwise.
   * @throws {PinggyError|Error} If stopping the tunnel fails.
   */
  public tunnelStop(): boolean {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return false;
    }
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
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return false;
    }
    try {
      const result = this.addon.tunnelIsActive(this.tunnelRef);
      Logger.info(`Tunnel active status: ${result}`);
      return result;
    } catch (e) {
      Logger.error("Error checking tunnel active status:", e as Error);
      return false;
    }
  }

  /**
   * Gets the list of public URLs for the tunnel.
   * @returns {string[]} The list of public tunnel URLs.
   */
  public getUrls(): string[] {
    return this._urls;
  }
}

// upto tunnel on error callback done
