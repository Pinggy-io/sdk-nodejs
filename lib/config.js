const addon = require("../build/Release/addon");

const { ConfigError } = require("./errors");

class Config {
  constructor() {
    this.config = null;
  }

  setOptions(options) {
    try {
      this.config = addon.createConfig();

      this.setServerAddress(options.serverAddress || "t.pinggy.io:443");
      this.setSniServerName(options.sniServerName || "t.pinggy.io");
      this.setTcpForwarding(options.tcpForwardTo || "localhost:4000");
      this.setAdvancedParsing(options.advancedParsing !== false);

      // Only set the token if it's provided
      if (options.token || process.env.TUNNEL_TOKEN) {
        this.setToken(options.token || process.env.TUNNEL_TOKEN);
      }
    } catch (error) {
      throw new ConfigError(`Error setting options: ${error.message}`);
    }
  }

  setToken(token) {
    addon.configSetToken(this.config, token);
  }

  setServerAddress(address) {
    addon.configSetServerAddress(this.config, address);
  }

  setSniServerName(name) {
    addon.configSetSniServerName(this.config, name);
  }

  setTcpForwarding(address) {
    addon.tcpForwardTo(this.config, address);
  }

  setAdvancedParsing(enabled) {
    addon.configSetAdvancedParsing(this.config, enabled);
  }

  setLogPath(path) {
    try {
      addon.setLogPath(path);
    } catch (error) {
      throw new ConfigError("Error setting log path: " + error.message);
    }
  }

  getConfig() {
    return this.config;
  }
}

module.exports = Config;
