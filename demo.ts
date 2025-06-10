import { Pinggy, startTunnel, startWebDebugging, stopTunnel } from "./src/index";
import { PinggyOptions } from "./src/types";

const options: PinggyOptions = {
  forwardTo: "localhost:3000",
  sniServerName: "t.pinggy.io",
  // token: process.env.TUNNEL_TOKEN_SUB,
};

(async function() {
  console.log("Starting tunnel...");
  const { tunnel, addresses } = await startTunnel(options);
  console.log("Tunnel started. Addresses:", addresses);

  console.log("Server Address:", tunnel.getServerAddress());
  console.log("SNI Server Name:", tunnel.getSniServerName());

  console.log("Starting web debugging...");
  startWebDebugging(tunnel, 8081);

  console.log("Waiting for 5 seconds...");
  // add a stop method
  // stop tunnel after 5 seconds
  setTimeout(() => {
    console.log("Stopping tunnel...");
    stopTunnel(tunnel);
  }, 5000);
})().catch(console.error); 