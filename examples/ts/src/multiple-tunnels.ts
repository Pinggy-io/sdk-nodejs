import { pinggy, PinggyOptions } from "@pinggy/pinggy";

(async () => {
  console.log("=== Multiple Tunnels Example ===");

  try {
    // Create multiple tunnels with different configurations
    const options1: PinggyOptions = {
      forwarding: "localhost:3000",
    };

    const options2: PinggyOptions = {
      forwarding: "localhost:4000",
    };

    // Create tunnel instances
    const tunnel1 = await pinggy.createTunnel(options1);
    const tunnel2 = await pinggy.createTunnel(options2);

    // Start both tunnels
    await tunnel1.start();
    await tunnel2.start();

    // Display tunnel information
    console.log("Tunnel 1 URLs:", await tunnel1.urls());
    console.log("Tunnel 1 Status:", await tunnel1.getStatus());

    console.log("Tunnel 2 URLs:", await tunnel2.urls());
    console.log("Tunnel 2 Status:", await tunnel2.getStatus());

    // Check all active tunnels
    const allTunnels = pinggy.getAllTunnels();
    console.log("Total active tunnels:", allTunnels.length);

    // Stop tunnels after 10 seconds
    setTimeout(async () => {
      console.log("Stopping all tunnels...");
      await tunnel1.stop();
      await tunnel2.stop();
      console.log("All tunnels stopped.");

      console.log("Remaining active tunnels:", pinggy.getAllTunnels().length);
    }, 10000);
  } catch (error) {
    console.error("Failed to create tunnels:", error);
  }
})();
