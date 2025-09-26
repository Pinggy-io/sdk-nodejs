import { pinggy, PinggyOptions, TunnelType } from "@pinggy/pinggy";

(async () => {
  console.log("=== Single Tunnel Example ===");

  try {
    // Simple tunnel creation with basic options
    const options: PinggyOptions = {
      forwarding: "localhost:3000",
      tunnelType: [TunnelType.Http],
    };

    const tunnel = await pinggy.forward(options);

    console.log("Tunnel URLs:", tunnel.urls());
    console.log("Status:", tunnel.getStatus());
    console.log("Is Active:", tunnel.isActive());

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
