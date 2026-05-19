// See README.md for full documentation and more usage notes
const express = require("express");
const { listen } = require("@pinggy/pinggy");

const app = express();

app.get("/", (req, res) => res.send("Hello from Express over Pinggy!"));
app.get("/health", (req, res) => res.json({ ok: true }));

(async () => {
  try {
    const server = await listen(app, {
       // token: "", // optional; omit for a free tunnel
      // other TunnelConfigurationV1 options can go here
    });

    const urls = await server.tunnel.urls();
    console.log("Tunnel public URLs:", urls);
    console.log("Local server port:", server.address().port);

    const shutdown = async () => {
      console.log("\nShutting down...");
      try {
        await server.tunnel.stop();
      } finally {
        server.close(() => process.exit(0));
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("Failed to start tunnel:", err);
    process.exit(1);
  }
})();
