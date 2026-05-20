import { pinggy, TunnelConfigurationV1 } from "@pinggy/pinggy";

(async () => {
  console.log("=== Multiple Tunnels Example ===");

  try {
    // Two independent tunnel instances, each forwarding to a different service.
    

    const options1: TunnelConfigurationV1 = {
      forwarding: "localhost:3000",
    };

    const options2: TunnelConfigurationV1 = {
      forwarding: "localhost:4000",
    };

    const tunnel1 = await pinggy.createTunnel(options1);
    const tunnel2 = await pinggy.createTunnel(options2);

    await Promise.all([tunnel1.start(), tunnel2.start()]);

    console.log("Tunnel 1 URLs:", await tunnel1.urls());
    console.log("Tunnel 1 Status:", await tunnel1.getStatus());

    console.log("Tunnel 2 URLs:", await tunnel2.urls());
    console.log("Tunnel 2 Status:", await tunnel2.getStatus());

    console.log("Total active tunnels:", pinggy.getAllTunnels().length);
    console.log("Press Ctrl+C to stop.");

    const shutdown = async () => {
      console.log("\nStopping all tunnels...");
      await Promise.all([tunnel1.stop(), tunnel2.stop()]);
      console.log("All tunnels stopped.");
      console.log("Remaining active tunnels:", pinggy.getAllTunnels().length);
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to create tunnels:", error);
    process.exit(1);
  }
})();
