const Logger = require("../utils/logger");

class Tunnel {
  constructor(addon, configRef) {
    this.addon = addon;
    this.tunnelRef = this.initialize(configRef);
  }

  initialize(configRef) {
    try {
      const tunnelRef = this.addon.tunnelInitiate(configRef);
      Logger.info(`Tunnel initiated with reference: ${tunnelRef}`);
      return tunnelRef;
    } catch (e) {
      Logger.error("Error initiating tunnel:", e);
      return null;
    }
  }

  start() {
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
        this.addon.tunnelRequestPrimaryForwarding(this.tunnelRef);
      });

      this.addon.tunnelSetPrimaryForwardingSucceededCallback(this.tunnelRef, (addresses) => {
        Logger.info("Primary forwarding done. Addresses:");
        addresses.forEach((address, index) => Logger.info(`  ${index + 1}: ${address}`));
      });

      this.poll();
    } catch (error) {
      Logger.error("Error in startTunnel:", error);
    }
  }

  poll() {
    const poll = () => {
      try {
        const error = this.addon.tunnelResume(this.tunnelRef);
        if (error) {
          Logger.error("Tunnel error detected, stopping polling.");
          return;
        }
        setImmediate(poll);
      } catch (e) {
        Logger.error("Error during tunnel polling:", e);
      }
    };
    poll();
  }
}

module.exports = Tunnel;