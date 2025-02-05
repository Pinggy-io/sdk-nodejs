const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
require("dotenv").config();
const addon = require("./build/Release/addon");

function startTunnel(tunnelRef) {
  // Connect the tunnel
  const connected = addon.tunnelConnect(tunnelRef);
  if (!connected) {
    console.error("Failed to connect the tunnel.");
    return;
  }

  console.log("Tunnel connected successfully.");

  // Request remote forwarding
  addon.tunnelRequestRemoteForwarding(tunnelRef); // Implement this wrapper if not done already
  console.log("Requested remote forwarding.");

  // Serve the tunnel (simulate infinite loop)
  const resumeInterval = setInterval(() => {
    const status = addon.tunnelResume(tunnelRef); // Returns int
    if (status < 0) {
      console.error("Tunnel resume failed. Stopping...");
      clearInterval(resumeInterval);
      addon.tunnelStop(tunnelRef);
    }
  }, 100); // Adjust the interval as needed

  // Stop the tunnel after 15 seconds (simulating the Python behavior)
  setTimeout(() => {
    console.log("Stopping tunnel...");
    addon.tunnelStop(tunnelRef);
    clearInterval(resumeInterval);
    console.log("Tunnel stopped.");
  }, 15000);
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

  addon.tunnelSetAuthenticatedCallback(tunnelRef, (tunnel) => {
    console.log(`Authentication completed for tunnel: ${tunnel}`);
  });

  addon.tunnelSetPrimaryForwardingSucceededCallback(tunnelRef, (addresses) => {
    console.log("Reverse forwarding done. Addresses:");
    addresses.forEach((address, index) => {
      console.log(`  ${index + 1}: ${address}`);
    });
  });

  console.log(`Tunnel initiated with reference: ${tunnelRef}`);
} catch (e) {
  console.error("Error initiating tunnel:", e);
}
if (!tunnelRef) process.exit(1);

// Start tunnel
try {
  const success = addon.tunnelStart(tunnelRef);
  console.log(`Tunnel started successfully: ${success}`);
} catch (e) {
  console.error("Error starting tunnel:", e);
}

// to do: try to use async function

// startTunnel(tunnelRef);

// Request remote forwarding
try {
  addon.tunnelRequestPrimaryForwarding(tunnelRef);
  console.log("Remote forwarding requested successfully.");
} catch (e) {
  console.error(
    `Error requesting remote forwarding for tunnel ${tunnelRef}:`,
    e
  );
}

// if (!isMainThread) {
//     try {
//         parentPort.postMessage({ log: "Worker: Connecting tunnel..." });

//         const connected = addon.tunnelConnect(workerData.tunnelRef);
//         if (!connected) {
//             parentPort.postMessage({ error: "Worker: Failed to connect tunnel." });
//             process.exit(1);
//         }

//         parentPort.postMessage({ log: "Worker: Tunnel connected successfully." });

//         // REMOVE THIS FOR NOW
//         // parentPort.postMessage({ log: "Worker: Requesting remote forwarding..." });
//         // addon.tunnelRequestRemoteForwarding(workerData.tunnelRef);
//         // parentPort.postMessage({ log: "Worker: Remote forwarding requested." });

//         // Start tunnel manually (without blocking)
//         parentPort.postMessage({ log: "Worker: Starting tunnel resume loop..." });

//         let iteration = 0;
//         while (true) {
//             try {
//                 parentPort.postMessage({ log: `Worker: Iteration ${iteration}` });
//                 const status = addon.tunnelResume(workerData.tunnelRef);
//                 parentPort.postMessage({ log: `Worker: Tunnel resume status = ${status}` });

//                 if (status < 0) {
//                     parentPort.postMessage({ error: "Worker: Tunnel resume failed. Stopping..." });
//                     addon.tunnelStop(workerData.tunnelRef);
//                     break;
//                 }

//                 iteration++;
//             } catch (resumeError) {
//                 parentPort.postMessage({ error: `Worker: Exception in resume loop: ${resumeError.message}` });
//                 break;
//             }
//         }

//         parentPort.postMessage({ log: "Worker: Tunnel stopped." });

//     } catch (e) {
//         parentPort.postMessage({ error: `Worker crashed: ${e.message}` });
//     }
// } else {
//     // MAIN THREAD
//     console.log("Starting tunnel in worker thread...");

//     const worker = new Worker(__filename, { workerData: { tunnelRef } });

//     // Listen for messages from worker
//     worker.on("message", (message) => {
//         if (message.log) console.log(message.log);
//         if (message.error) console.error(message.error);
//         if (message.success) console.log("Tunnel started successfully!");
//     });

//     // Listen for worker exit
//     worker.on("exit", (code) => {
//         if (code !== 0) console.error(`Worker exited with code ${code}`);
//     });

//     console.log("This message appears immediately because tunnelStart runs in a worker.");
// }

// To do:

// - pinggy_tunnel_connect returns true or false
// - if returns true, pinggy_tunnel_resume in a infinite loop, check error no
// - authenticated callback
// - pinggy_tunnel_request_primary_forwarding
// - primary_forwarding_success continue polling
// - sandip chakraborty sir, nptel, iit kharagpur
// - network layers, transport layers