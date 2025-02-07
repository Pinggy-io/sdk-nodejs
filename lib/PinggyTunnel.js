const Config = require("./config");
const Tunnel = require("./tunnel");
const { ConfigError, TunnelError } = require("./errors");

class PinggyTunnel {
  constructor(options = {}) {
    this.config = new Config();
    this.tunnel = new Tunnel();
    this.initialize(options);

    // debug
    console.log("in PinggyTunnel constructor");
  }

  initialize(options) {
    // debug
    console.log("in initialize()");

    try {
      this.config.setOptions(options);
    } catch (error) {
      throw new ConfigError("Error during initialization: " + error.message);
    }
  }

  async connect() {
    try {
      // debug
      console.log("in connect()");
      console.log("this.config.getConfig():", this.config.getConfig());

      await this.tunnel.initiate(this.config.getConfig());

      //   debug
      console.log(
        "tunnel initiated with reference: ${this.tunnel.getTunnel()} in connect() now calling setupTunnelCallbacks()"
      );

      await this.tunnel.setupTunnelCallbacks();
      this.tunnel.pollTunnel();
      return true;
    } catch (error) {
      throw new TunnelError("Error in connect: " + error.message);
    }
  }

  setLogPath(path) {
    this.config.setLogPath(path);
  }
}

module.exports = PinggyTunnel;
