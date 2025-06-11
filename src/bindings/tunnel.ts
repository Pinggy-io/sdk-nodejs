import { Logger } from "../utils/logger";
import { PinggyNative, Tunnel as ITunnel } from "../types";

export class Tunnel implements ITunnel {
  public tunnelRef: number;
  public authenticated: boolean;
  public primaryForwardingDone: boolean;
  private addon: PinggyNative;
  private authPromise: Promise<void>;
  private forwardingPromise: Promise<string[]>;
  private resolveAuth: (() => void) | null = null;
  private resolveForwarding: ((addresses: string[]) => void) | null = null;

  constructor(addon: PinggyNative, configRef: number) {
    this.addon = addon;
    this.tunnelRef = this.initialize(configRef);
    this.authenticated = false;
    this.primaryForwardingDone = false;

    // Create promises that will be resolved when authentication and forwarding complete
    this.authPromise = new Promise((resolve) => {
      this.resolveAuth = resolve;
    });

    this.forwardingPromise = new Promise((resolve) => {
      this.resolveForwarding = resolve;
    });
  }

  private initialize(configRef: number): number {
    try {
      const tunnelRef = this.addon.tunnelInitiate(configRef);
      Logger.info(`Tunnel initiated with reference: ${tunnelRef}`);
      return tunnelRef;
    } catch (e) {
      Logger.error("Error initiating tunnel:", e as Error);
      return 0;
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

        this.addon.tunnelSetPrimaryForwardingSucceededCallback(
            this.tunnelRef,
            (addresses) => {
                this.primaryForwardingDone = true;
                if (this.resolveForwarding) {
                    this.resolveForwarding(addresses);
                }
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
        Logger.error("Error in startTunnel:", error as Error);
        throw error;
    }
  }

  // private pollStart(): void {
  //   const resume = async (): Promise<boolean> => {
  //     try {
  //       const error = this.addon.tunnelResume(this.tunnelRef);
  //       if (error) {
  //         Logger.error("Tunnel error detected, stopping polling.");
  //         return false;
  //       }
  //       return true;
  //     } catch (e) {
  //       Logger.error("Error during tunnel polling:", e as Error);
  //       return false;
  //     }
  //   };

  //   const poll = async () => {
  //     // const shouldContinue = await resume();
  //     // if (shouldContinue) {
  //     //   poll();
  //     // }
  //     resume().then((success) => {
  //       poll();
  //     });
  //   };

  //   poll();
  // }

  private pollStart(): void {
    // A simple sync-style poll that schedules itself only on success:
    const poll = (): void => {
      let shouldContinue: boolean;
      try {
        // tunnelResume throws on error (<0), otherwise returns >=0
        const ret = this.addon.tunnelResume(this.tunnelRef);
        if (!ret) {
          Logger.error("Tunnel error detected, stopping polling.");
          return;        // STOP polling
        }
        shouldContinue = true;
      } catch (e) {
        Logger.error("Error during tunnel polling:", e as Error);
        return;          // STOP polling
      }
  
      // only schedule next poll if no error
      if (shouldContinue) {
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
      Logger.error("Error starting web debugging:", e as Error);
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
      Logger.error("Error requesting additional forwarding:", e as Error);
    }
  }

  public tunnelStop(): boolean {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return false;
    }
    try {
      const result = this.addon.tunnelStop(this.tunnelRef);
      if (result) {
        Logger.info("Tunnel stopped successfully.");
      } else {
        Logger.error("Failed to stop tunnel.");
      }
      return result;
    } catch (e) {
      Logger.error("Error stopping tunnel:", e as Error);
      return false;
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
}
