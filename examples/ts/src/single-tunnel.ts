import { pinggy, TunnelConfigurationV1, TunnelType } from "@pinggy/pinggy";

(async () => {
  console.log("=== Single Tunnel Example (multiple forwardings) ===");

  try {
    // One tunnel can forward to several local services.
    // Set PINGGY_TOKEN in your environment to use a paid token; otherwise
    // a free, time-limited tunnel will be created.
    const options: TunnelConfigurationV1 = {
      forwarding: [
        {
          address: "localhost:3000",
          type: TunnelType.Http,
        },
        {
          address: "localhost:4000",
          // listenAddress: "your-subdomain.example.com", // requires a reserved domain
          type: TunnelType.Http,
        },
      ],
      token: process.env.PINGGY_TOKEN,
    };

    const tunnel = await pinggy.forward(options);

    console.log("Tunnel URLs:", await tunnel.urls());
    console.log("Status:", await tunnel.getStatus());
    console.log("Is Active:", await tunnel.isActive());
    console.log("Press Ctrl+C to stop.");

    const shutdown = async () => {
      console.log("\nStopping tunnel...");
      await tunnel.stop();
      console.log("Tunnel stopped.");
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start tunnel:", error);
    process.exit(1);
  }
})();
