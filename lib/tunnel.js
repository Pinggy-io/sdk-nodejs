const addon = require("../build/Release/addon");
const { TunnelError } = require("./errors");

class Tunnel {
  constructor() {
    this.tunnel = null;
  }

  async initiate(config) {
    // debug
    console.log("in initiate() in lib/tunnel.js");

    try {
      // debug
      console.log("trying to intiate tunnel with config:", config);
      this.tunnel = addon.tunnelInitiate(config);

      // debug
      console.log("tunnel initiated with refence:", this.tunnel);
    } catch (error) {
      throw new TunnelError("Error initiating tunnel: " + error.message);
    }
  }

  setupTunnelCallbacks() {
    // debug
    console.log("in setupTunnelCallbacks() in lib/tunnel.js");
    return new Promise((resolve) => {
        
      addon.tunnelSetAuthenticatedCallback(this.tunnel, () => {
        console.log("Tunnel authenticated, requesting primary forwarding...");
        addon.tunnelRequestPrimaryForwarding(this.tunnel);
      });

      //   debug
      console.log(
        "authentical callback set, now setting primary forwarding callback"
      );

      addon.tunnelSetPrimaryForwardingSucceededCallback(
        this.tunnel,
        (addresses) => {
          console.log("Primary forwarding done. Addresses:");
          addresses.forEach((address, index) => {
            console.log(`  ${index + 1}: ${address}`);
          });
          resolve(true);
        }
      );
    });
  }

  pollTunnel() {
    const poll = () => {
      const error = addon.tunnelResume(this.tunnel);
      if (!error) {
        setImmediate(poll);
      } else {
        console.error("Tunnel error detected, stopping polling.");
      }
    };
    poll();
  }

  getTunnel() {
    return this.tunnel;
  }
}

module.exports = Tunnel;
