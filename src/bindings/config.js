const Logger = require("../utils/logger");

class Config {
  constructor(addon, options = {}) {
    this.addon = addon;
    this.configRef = this.initialize(options);
  }

  initialize(options) {
    try {
      const configRef = this.addon.createConfig();
      Logger.info(`Created config with reference: ${configRef}`);

      // do the above but in a try catch block, and log the error if it fails
      if (options.token) {
        try {
          this.addon.configSetToken(configRef, options.token);
          Logger.info("Token set successfully");
        } catch (e) {
          Logger.error("Error setting token:", e);
        }
      }

      // Apply user-defined values or set defaults
      const serverAddress = options.serverAddress || "t.pinggy.io:443";
      const sniServerName = options.sniServerName || "t.pinggy.com";
      const forwardTo = options.forwardTo || "localhost:4000";

      this.addon.configSetServerAddress(configRef, serverAddress);
      this.addon.configSetSniServerName(configRef, sniServerName);
      this.addon.configSetTcpForwardTo(configRef, forwardTo);

      // Set log path
      this.addon.setLogPath("./logs.log");

      Logger.info("Configurations applied successfully.");
      return configRef;
    } catch (e) {
      Logger.error("Error creating configuration:", e);
      return null;
    }
  }

  setToken(token) {
    try {
      if (this.configRef) this.addon.configSetToken(this.configRef, token);
    } catch (e) {
      Logger.error("Error setting token:", e);
    }
  }

  setServerAddress(address = "t.pinggy.io:443") {
    try {
      if (this.configRef)
        this.addon.configSetServerAddress(this.configRef, address);
    } catch (e) {
      Logger.error("Error setting server address:", e);
    }
  }

  getServerAddress() {
    try {
      return this.configRef
        ? this.addon.configGetServerAddress(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting server address:", e);
      return null;
    }
  }

  getSniServerName() {
    try {
      return this.configRef
        ? this.addon.configGetSniServerName(this.configRef)
        : null;
    } catch (e) {
      Logger.error("Error getting SNI server name:", e);
      return null;
    }
  }

  getToken() {
    try {
      return this.configRef ? this.addon.configGetToken(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting token:", e);
      return null;
    }
  }
}

module.exports = Config;
