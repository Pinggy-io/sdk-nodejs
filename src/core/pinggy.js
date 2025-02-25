const addon = require("../../build/Release/addon");
const Config = require("../bindings/config");
const Tunnel = require("../bindings/tunnel");
const Logger = require("../utils/logger");

class PinggySDK {
  constructor(options = {}) {
    this.config = null;
    this.tunnel = null;

    // Proceed with normal initialization
    this.initialize(options);
  }

  initialize(options) {
    addon.initExceptionHandling();
    try {
      this.config = new Config(addon, options);
      if (!this.config.configRef) {
        throw new Error("Failed to initialize config.");
      }
      this.tunnel = new Tunnel(addon, this.config.configRef);
    } catch (e) {
      Logger.error("Error initializing PinggySDK:", e);
      console.log("last exception" + addon.getLastException())
    }
  }

  startTunnel() {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.start();
    } catch (e) {
      Logger.error("Error starting tunnel:", e);
    }
  }

  startWebDebugging(listeningPort) {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.startWebDebugging(listeningPort);
    } catch (e) {
      Logger.error("Error starting web debugging:", e);
    }
  }

  tunnelRequestAdditionalForwarding(hostname, target) {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
    } catch (e) {
      Logger.error("Error requesting additional forwarding:", e);
    }
  }

  getServerAddress() {
    return this.config.getServerAddress();
  }

  getSniServerName() {
    return this.config.getSniServerName();
  }

  getToken() {
    return this.config.getToken();
  }
}

module.exports = PinggySDK;