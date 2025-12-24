import { pinggy, PinggyOptions } from "@pinggy/pinggy";

(async () => {
  console.log("=== Single Tunnel Example ===");

  try {
    // Simple tunnel creation with basic options
    const options: PinggyOptions = {
      forwarding: "localhost:3000",
    };

    const tunnel = await pinggy.forward(options);

    console.log("Tunnel URLs:", await tunnel.urls());
    console.log("Status:", await tunnel.getStatus());
    console.log("Is Active:", await  tunnel.isActive());

    // Let the tunnel run for 10 seconds
    setTimeout(() => {
      console.log("Stopping tunnel...");
      tunnel.stop();
      console.log("Tunnel stopped.");
    }, 10000);
  } catch (error) {
    console.error("Failed to start tunnel:", error);
  }
})();
