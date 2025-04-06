import { Logger } from "../utils/logger";
import { PinggyNative, Tunnel as ITunnel } from "../types";

export class Tunnel implements ITunnel {
  public tunnelRef: number;
  public authenticated: boolean;
  public primaryForwardingDone: boolean;
  private addon: PinggyNative;
  private authQueue: (() => void)[];
  private forwardingQueue: (() => void)[];

  constructor(addon: PinggyNative, configRef: number) {
    this.addon = addon;
    this.tunnelRef = this.initialize(configRef);
    this.authenticated = false;
    this.primaryForwardingDone = false;
    this.authQueue = []; // Queue for functions that need authentication
    this.forwardingQueue = []; // Queue for additional forwarding requests
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

  public start(): void {
    if (!this.tunnelRef) return;
    try {
      const connected = this.addon.tunnelConnect(this.tunnelRef);
      if (!connected) {
        Logger.error("Tunnel connection failed.");
        return;
      }
      Logger.info("Tunnel connected, starting authentication monitoring...");

      this.addon.tunnelSetAuthenticatedCallback(this.tunnelRef, () => {
        Logger.info("Tunnel authenticated, requesting primary forwarding...");
        this.authenticated = true;
        this.authQueue.forEach((fn) => fn()); // Execute queued functions
        this.authQueue = []; // Clear queue
        this.addon.tunnelRequestPrimaryForwarding(this.tunnelRef);
      });

      this.addon.tunnelSetPrimaryForwardingSucceededCallback(
        this.tunnelRef,
        (addresses) => {
          Logger.info("Primary forwarding done. Addresses:");
          addresses.forEach((address, index) =>
            Logger.info(`  ${index + 1}: ${address}`)
          );
          this.primaryForwardingDone = true;

          // Process any additional forwarding requests after primary forwarding
          this.forwardingQueue.forEach((fn) => fn());
          this.forwardingQueue = []; // Clear the queue
        }
      );

      this.poll();
    } catch (error) {
      Logger.error("Error in startTunnel:", error as Error);
    }
  }

  private poll(): void {
    const poll = () => {
      try {
        const error = this.addon.tunnelResume(this.tunnelRef);
        if (error) {
          Logger.error("Tunnel error detected, stopping polling.");
          return;
        }
        setImmediate(poll);
      } catch (e) {
        Logger.error("Error during tunnel polling:", e as Error);
      }
    };
    poll();
  }

  public startWebDebugging(listeningPort: number): void {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }

    const startDebugging = () => {
      try {
        this.addon.tunnelStartWebDebugging(this.tunnelRef, listeningPort);
        Logger.info(
          `Web debugging started on port ${listeningPort} visit http://localhost:${listeningPort}`
        );
      } catch (e) {
        Logger.error("Error starting web debugging:", e as Error);
      }
    };

    if (this.authenticated) {
      startDebugging(); // Run immediately if authenticated
    } else {
      Logger.info("Tunnel not yet authenticated. Queuing startWebDebugging...");
      this.authQueue.push(startDebugging); // Queue execution
    }
  }

  public tunnelRequestAdditionalForwarding(
    remoteAddress: string,
    localAddress: string
  ): void {
    if (!this.tunnelRef) {
      Logger.error("Tunnel not initialized.");
      return;
    }

    const requestForwarding = () => {
      try {
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
    };

    if (this.primaryForwardingDone) {
      requestForwarding(); // Run immediately if primary forwarding succeeded
    } else {
      Logger.info(
        "Primary forwarding not yet completed. Queuing additional forwarding..."
      );
      this.forwardingQueue.push(requestForwarding); // Queue execution
    }
  }
}
