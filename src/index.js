const PinggySDK = require("./core/pinggy");
require("dotenv").config();

const tunnel = new PinggySDK({
  forwardTo: "localhost:3000",
  token: process.env.TUNNEL_TOKEN_SUB,
  sniServerName: "t.pinggy.io",
});

console.log("Server Address:", tunnel.getServerAddress());
console.log("SNI Server Name:", tunnel.getSniServerName());
// console.log("Token:", tunnel.getToken());

tunnel.startTunnel();

// Start web debugging after 2 seconds
// setTimeout(() => {
//   tunnel.startWebDebugging(3001);
// }, 1000);

tunnel.startWebDebugging(8081);

// Request additional forwarding after 2 seconds
tunnel.tunnelRequestAdditionalForwarding(
  "pompom.abhijitmondal.in",
  "localhost:4000"
);

// console.log(tunnel.getLastException());

// To do:
// On C side, threadlocal variable (global variable but local to thread)
// select/poll
// handle exception

// 18.02.2025
// try to check if nodejs is running the processes on different threads
// check how to read threadlocal variable in nodejs