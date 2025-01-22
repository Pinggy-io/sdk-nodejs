const addon = require('./build/Release/addon');

// Set log path
addon.setLogPath('./logs.log');
console.log("Logs path set successfully");

// Create a configuration
const configRef = addon.createConfig();
console.log(`Created config with reference: ${configRef}`);

// Set the server address for the configuration
addon.configSetServerAddress(configRef, "t.pinggy.io:443");
console.log(`Server address set for config ${configRef}`);

// Get the server address
const serverAddress = addon.configGetServerAddress(configRef);
console.log(`Current server address for config ${configRef}: ${serverAddress}`);

// Set the SNI server name
addon.configSetSniServerName(configRef, "t.pinggy.io");

// Get the SNI server name
const sniServerName = addon.configGetSniServerName(configRef);
console.log(`Current SNI server name for config ${configRef}: ${sniServerName}`);

// Set the advanced parsing flag to true
addon.configSetAdvancedParsing(configRef, true);

// Check if advanced parsing is enabled
const isAdvancedParsingEnabled = addon.configGetAdvancedParsing(configRef);
console.log(`Advanced parsing is ${isAdvancedParsingEnabled ? 'enabled' : 'disabled'} for config ${configRef}`);

// Initiate the tunnel
const tunnelRef = addon.tunnelInitiate(configRef);
console.log(`Tunnel created with reference: ${tunnelRef}`);

// Start the tunnel (this will block indefinitely)
const success = addon.tunnelStart(tunnelRef);
console.log(`Tunnel started: ${success}`);

// Request remote forwarding
// addon.tunnelRequestRemoteForwarding(tunnelRef);
// console.log(`Remote forwarding requested for tunnel ${tunnelRef}`);