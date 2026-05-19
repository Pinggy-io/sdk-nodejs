import { pinggy } from "@pinggy/pinggy";

(async () => {
  console.log("Quick demonstration - creating a simple tunnel to localhost:3000:");
  try {
    const tunnel = await pinggy.forward({
      forwarding: "localhost:3000",
      token: process.env.PINGGY_TOKEN, // optional; omit for a free tunnel
    });

    console.log("Tunnel created successfully!");
    console.log("URLs:", await tunnel.urls());
    console.log("Greet Message:", await tunnel.getGreetMessage());
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
    console.error("Failed to create demo tunnel:", error);
    process.exit(1);
  }
})();
