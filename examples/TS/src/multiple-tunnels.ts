import { pinggy, PinggyOptions } from "pinggy";

(async () => {
  console.log("=== Multiple Tunnels Example ===");

  try {
    // Create multiple tunnels with different configurations
    const options1: PinggyOptions = {
      forwardTo: "localhost:3000",
      type: "http",
    };

    const options2: PinggyOptions = {
      forwardTo: "localhost:4000",
      type: "http",
      ssl: false,
    };

    // Create tunnel instances
    const tunnel1 = pinggy.createTunnel(options1);
    const tunnel2 = pinggy.createTunnel(options2);

    // Start both tunnels
    await tunnel1.start();
    await tunnel2.start();

    // Display tunnel information
    console.log("Tunnel 1 URLs:", tunnel1.urls());
    console.log("Tunnel 1 Status:", tunnel1.getStatus());

    console.log("Tunnel 2 URLs:", tunnel2.urls());
    console.log("Tunnel 2 Status:", tunnel2.getStatus());

    // Check all active tunnels
    const allTunnels = pinggy.getAllTunnels();
    console.log("Total active tunnels:", allTunnels.length);

    // Stop tunnels after 10 seconds
    setTimeout(() => {
      console.log("Stopping all tunnels...");
      tunnel1.stop();
      tunnel2.stop();
      console.log("All tunnels stopped.");

      console.log("Remaining active tunnels:", pinggy.getAllTunnels().length);
    }, 10000);
  } catch (error) {
    console.error("Failed to create tunnels:", error);
  }
})();
