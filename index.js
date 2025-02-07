require("dotenv").config();
const addon = require("./build/Release/addon");

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

    // Start polling loop
    pollTunnel(tunnel);
  } catch (error) {
    console.error("Error in startTunnel:", error);
  }
}

function pollTunnel(tunnel) {
  const poll = () => {
    const error = addon.tunnelResume(tunnel);
    if (error) {
      console.error("Tunnel error detected, stopping polling.");
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
  addon.configSetToken(configRef, process.env.TUNNEL_TOKEN);

  console.log("Token set successfully");
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
  addon.tcpForwardTo(configRef, "localhost:4000");
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

// =================================================

// ==================== BLOCKING ====================

// Start tunnel - blocking
// try {
//   const success = addon.tunnelStart(tunnelRef);
//   console.log(`Tunnel started successfully: ${success}`);
// } catch (e) {
//   console.error("Error starting tunnel:", e);
// }

// // Request remote forwarding
// try {
//   addon.tunnelRequestPrimaryForwarding(tunnelRef);
//   console.log("Remote forwarding requested successfully.");
// } catch (e) {
//   console.error(
//     `Error requesting remote forwarding for tunnel ${tunnelRef}:`,
//     e
//   );
// }

// =================================================

// To do:

// - pinggy_tunnel_connect returns true or false
// - if returns true, pinggy_tunnel_resume in a infinite loop, check error no
// - authenticated callback
// - pinggy_tunnel_request_primary_forwarding
// - primary_forwarding_success continue polling
// - sandip chakraborty sir, nptel, iit kharagpur
// - network layers, transport layers

// To do: 06.02.2025
// - EINTR error handling
// - Understand and debug => Error: ���
// at Immediate.poll (/home/sky09/projects/pinggy-learnings/pinggy/index.js:42:25)
// at processImmediate (node:internal/timers:466:21)