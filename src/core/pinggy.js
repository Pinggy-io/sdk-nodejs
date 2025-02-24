// const addon = require("../../build/Release/addon");
// const Config = require("../bindings/config");
// const Tunnel = require("../bindings/tunnel");
// const Logger = require("../utils/logger");

// class PinggySDK {
//   constructor(options = {}) {
//     this.config = new Config(addon, options);
//     this.tunnel = null;
//     this.lastException = null; // Store the last error message

//     this.setExceptionHandler(); // Set up exception handling
//     this.initialize();
//   }

//   initialize() {
//     if (!this.config.configRef) {
//       Logger.error("Failed to initialize config.");
//       return;
//     }
//     this.tunnel = new Tunnel(addon, this.config.configRef);
//   }

//   startTunnel() {
//     if (!this.tunnel) {
//       Logger.error("Tunnel not initialized.");
//       return;
//     }
//     this.tunnel.start();
//   }

//   getServerAddress() {
//     return this.config.getServerAddress();
//   }

//   getSniServerName() {
//     return this.config.getSniServerName();
//   }

//   getToken() {
//     return this.config.getToken();
//   }

//   startWebDebugging(listeningPort) {
//     if (!this.tunnel) {
//       Logger.error("Tunnel not initialized.");
//       return;
//     }
//     this.tunnel.startWebDebugging(listeningPort);
//   }

//   tunnelRequestAdditionalForwarding(hostname, target) {
//     if (!this.tunnel) {
//       Logger.error("Tunnel not initialized.");
//       return;
//     }
//     this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
//   }
// }

// module.exports = PinggySDK;

const addon = require("../../build/Release/addon");
const Config = require("../bindings/config");
const Tunnel = require("../bindings/tunnel");
const Logger = require("../utils/logger");

class PinggySDK {
  constructor(options = {}) {
    this.config = null;
    this.tunnel = null;
    this.lastException = null;

    // Initialize exception handling at the start
    this.initExceptionHandling();

    // Proceed with normal initialization
    this.initialize(options);
  }

  // 🔹 Initialize Pinggy Exception Handling
  initExceptionHandling() {
    try {
      addon.initExceptionHandling();
      Logger.info("Pinggy exception handling initialized.");
    } catch (e) {
      Logger.error("Failed to initialize exception handling:", e);
    }
  }

  // 🔹 Fetch last exception from native addon
  updateLastException() {
    try {
      const exception = addon.getLastException();
      if (exception) {
        this.lastException = exception;
        Logger.error("Pinggy Exception:", exception);
      }
    } catch (e) {
      Logger.error("Error retrieving last exception:", e);
    }
  }

  // 🔹 Public method to retrieve the last exception
  getLastException() {
    return this.lastException;
  }

  initialize(options) {
    try {
      this.config = new Config(addon, options);
      if (!this.config.configRef) {
        throw new Error("Failed to initialize config.");
      }
      this.tunnel = new Tunnel(addon, this.config.configRef);
    } catch (e) {
      Logger.error("Error initializing PinggySDK:", e);
      this.updateLastException();
    }
  }

  startTunnel() {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.start();
    } catch (e) {
      Logger.error("Error starting tunnel:", e);
      this.updateLastException();
    }
  }

  startWebDebugging(listeningPort) {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.startWebDebugging(listeningPort);
    } catch (e) {
      Logger.error("Error starting web debugging:", e);
      this.updateLastException();
    }
  }

  tunnelRequestAdditionalForwarding(hostname, target) {
    try {
      if (!this.tunnel) throw new Error("Tunnel not initialized.");
      this.tunnel.tunnelRequestAdditionalForwarding(hostname, target);
    } catch (e) {
      Logger.error("Error requesting additional forwarding:", e);
      this.updateLastException();
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