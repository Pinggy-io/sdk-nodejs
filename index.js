// const addon = require("./build/Release/addon");
const binary = require("@mapbox/node-pre-gyp");
const path = require("path");
const binding_path = binary.find(
  path.resolve(path.join(__dirname, "./package.json"))
);
const addon = require(binding_path);

function startTunnel(tunnel) {
  try {
    const connected = addon.tunnelConnect(tunnel);

    // Check if connected
    if (!connected) {
      console.error("Tunnel connection failed.");
      return;
    }

    console.log("Tunnel connected, starting authentication monitoring...");

    // Set authenticated callback
    addon.tunnelSetAuthenticatedCallback(tunnel, () => {
      console.log("Tunnel authenticated, requesting primary forwarding...");
      addon.tunnelRequestPrimaryForwarding(tunnel);
    });

    // Set primary forwarding success callback
    addon.tunnelSetPrimaryForwardingSucceededCallback(
      tunnelRef,
      (addresses) => {
        console.log("Primary forwarding done. Addresses:");
        addresses.forEach((address, index) => {
          console.log(`  ${index + 1}: ${address}`);
        });
      }
    );

    // set additional forwarding
    // setTimeout(() => {
    //   addon.tunnelRequestAdditionalForwarding(
    //     tunnel,
    //     "pompom.abhijitmondal.in",
    //     "localhost:4000"
    //   );
    // }, 1000);

    // Start polling loop
    pollTunnel(tunnel);
  } catch (error) {
    console.error("Error in startTunnel:", error);
  }
}

function pollTunnel(tunnel) {
  const poll = () => {
    // wrap in error in a try-catch to handle any unexpected errors
    try {
      // const error = addon.tunnelResume(tunnel);
      const error = addon.tunnelResume(tunnel);
      console.log("Tunnel resumed:", error);
      if (error) {
        console.error("Tunnel error detected, stopping polling.");
        return;
      }
    } catch (error) {
      console.error("Error resuming tunnel:", error);
      return;
    }
    setImmediate(poll); // Non-blocking loop
  };

  poll();
}

// Set log path
try {
  addon.setLogPath("./logs.log");
  console.log("Logs path set successfully");
} catch (e) {
  console.error("Error setting log path:", e);
}

// Create a configuration
let configRef;
try {
  configRef = addon.createConfig();
  console.log(`Created config with reference: ${configRef}`);

  // Set the token
  //   addon.configSetToken(configRef, process.env.TUNNEL_TOKEN_SUB);

  //   console.log("Token set successfully");
} catch (e) {
  console.error("Error creating configuration:", e);
}
if (!configRef) process.exit(1);

// Set token

// Set server address
try {
  addon.configSetServerAddress(configRef, "t.pinggy.io:443");
  console.log("Server address set successfully.");
} catch (e) {
  console.error("Error setting server address:", e);
}

// Get server address
try {
  const serverAddress = addon.configGetServerAddress(configRef);
  console.log(`Current server address: ${serverAddress}`);
} catch (e) {
  console.error("Error getting server address:", e);
}

// Set and get SNI server name
try {
  addon.configSetSniServerName(configRef, "t.pinggy.io");
  console.log("SNI server name set successfully.");
  const sniServerName = addon.configGetSniServerName(configRef);
  console.log(`Current SNI server name: ${sniServerName}`);
} catch (e) {
  console.error("Error handling SNI server name:", e);
}

// Set TCP Fowarding
try {
  addon.configSetTcpForwardTo(configRef, "localhost:8000");
  console.log("TCP forwarding set successfully.");
} catch (e) {
  console.error("Error setting TCP forwarding:", e);
}

// Set advanced parsing
try {
  addon.configSetAdvancedParsing(configRef, true);
  const isEnabled = addon.configGetAdvancedParsing(configRef);
  console.log(`Advanced parsing is ${isEnabled ? "enabled" : "disabled"}`);
} catch (e) {
  console.error("Error handling advanced parsing:", e);
}

// Initiate tunnel
let tunnelRef;
try {
  tunnelRef = addon.tunnelInitiate(configRef);

  console.log(`Tunnel initiated with reference: ${tunnelRef}`);
} catch (e) {
  console.error("Error initiating tunnel:", e);
}
if (!tunnelRef) process.exit(1);

// ==================== NON-BLOCKING ====================

// start tunnel in a non-blocking way using the startTunnel function
startTunnel(tunnelRef);

function stopTunnel(tunnel) {
  try {
    const result = addon.tunnelStop(tunnel);
    if (result) {
      console.log("Tunnel stopped successfully.");
    } else {
      console.error("Failed to stop tunnel.");
    }
    return result;
  } catch (e) {
    console.error("Error stopping tunnel:", e);
    return false;
  }
}

// Example: Stop the tunnel after 10 seconds
setTimeout(() => {
  stopTunnel(tunnelRef);
}, 5000);
