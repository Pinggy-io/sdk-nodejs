import { pinggy, PinggyOptions } from "pinggy";

(async () => {
  console.log("=== Single Tunnel Example ===");

  try {
    // Simple tunnel creation with basic options
    const options: PinggyOptions = {
      forwardTo: "localhost:3000",
      type: "http",
      ssl: true,
    };

    const tunnel = await pinggy.forward(options);

    console.log("Tunnel URLs:", tunnel.urls());
    console.log("Status:", tunnel.getStatus());
    console.log("Server Address:", tunnel.getServerAddress());
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
