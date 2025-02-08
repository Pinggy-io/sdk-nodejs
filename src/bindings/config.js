const Logger = require("../utils/logger");

class Config {
  constructor(addon) {
    this.addon = addon;
    this.configRef = this.initialize();
  }

  initialize() {
    try {
      const configRef = this.addon.createConfig();
      Logger.info(`Created config with reference: ${configRef}`);

      // Set default values
      this.addon.configSetServerAddress(configRef, "t.pinggy.io:443");
      this.addon.configSetSniServerName(configRef, "t.pinggy.io");
      this.addon.tcpForwardTo(configRef, "localhost:4000");
    //   set log path to the logs.log in the root of the project
      this.addon.setLogPath("./logs.log");
      
      Logger.info("Default configurations set successfully.");
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
      if (this.configRef) this.addon.configSetServerAddress(this.configRef, address);
    } catch (e) {
      Logger.error("Error setting server address:", e);
    }
  }

  getServerAddress() {
    try {
      return this.configRef ? this.addon.configGetServerAddress(this.configRef) : null;
    } catch (e) {
      Logger.error("Error getting server address:", e);
      return null;
    }
  }
}

module.exports = Config;