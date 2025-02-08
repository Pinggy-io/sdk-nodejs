const addon = require("../../build/Release/addon");
const Config = require("../bindings/config");
const Tunnel = require("../bindings/tunnel");
const Logger = require("../utils/logger");

class PinggySDK {
  constructor() {
    this.config = new Config(addon);
    this.tunnel = null;
  }

  initialize() {
    if (!this.config.configRef) {
      Logger.error("Failed to initialize config.");
      return;
    }
    this.tunnel = new Tunnel(addon, this.config.configRef);
  }

  startTunnel() {
    if (!this.tunnel) {
      Logger.error("Tunnel not initialized.");
      return;
    }
    this.tunnel.start();
  }
}

module.exports = new PinggySDK();