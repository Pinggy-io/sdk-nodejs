import { Logger } from "../utils/logger";
import { PinggyNative, Tunnel as ITunnel } from "../types";
import { PinggyError } from "./exception";

export class Tunnel implements ITunnel {
  public tunnelRef: number;
  public authenticated: boolean;
  public primaryForwardingDone: boolean;
  public status: "starting" | "live" | "closed";
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

  constructor(addon: PinggyNative, configRef: number) {
    this.addon = addon;
    this.tunnelRef = this.initialize(configRef);
    this.authenticated = false;
    this.primaryForwardingDone = false;
    this.status = "starting";

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

  public async start(): Promise<string[]> {
    if (!this.tunnelRef) {
      throw new Error("Tunnel not initialized.");
    }

    try {
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

      const connected = this.addon.tunnelConnect(this.tunnelRef);
      if (!connected) {
        throw new Error("Tunnel connection failed.");
      }
      Logger.info("Tunnel connected, starting authentication monitoring...");

      this.pollStart();

      // Wait for forwarding to complete and return the addresses
      return await this.forwardingPromise;
    } catch (error) {
      this.status = "closed";
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
          this.status = "closed";
          return; // STOP polling
        }
        if (this.status === "starting") {
          this.status = "live";
        }
        shouldContinue = true;
      } catch (e) {
        this.status = "closed";

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

  public async tunnelRequestAdditionalForwarding(
    remoteAddress: string,
    localAddress: string
  ): Promise<void> {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }

    try {
      await this.forwardingPromise; // Wait for primary forwarding to complete
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

  public tunnelStop(): boolean {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return false;
    }
    try {
      // Mark as intentionally stopped before calling native stop
      this.intentionallyStopped = true;
      this.status = "closed";

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

  public getUrls(): string[] {
    return this._urls;
  }
}

// upto tunnel on error callback done
