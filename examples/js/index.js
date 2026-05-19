/**
 * Pinggy SDK — JavaScript example
 *
 * Creates a Pinggy tunnel that exposes a local HTTP service running on
 * localhost:7878, prints the public URLs, and stops the tunnel cleanly
 * after a fixed duration or on Ctrl-C.
 *
 * Run: node index.js
 */

const { pinggy } = require("@pinggy/pinggy");

const TUNNEL_DURATION_MS = 20_000;

async function main() {
  // Optional: enable verbose logs to stdout for troubleshooting.
  // pinggy.setDebugLogging(true, "debug");

  const options = {
    forwarding: [{ address: "localhost:7878", type: "http" }],
    webDebugger: "localhost:8100",
  };

  const tunnel = await pinggy.createTunnel(options);


  await tunnel.start();

  const urls = await tunnel.urls();
  console.log("Tunnel URLs:        ", urls);
  console.log("Tunnel status:      ", await tunnel.getStatus());
  console.log("Web debugger:       ", await tunnel.getWebDebuggerInfo());

  const stop = async (reason) => {
    console.log(`\nStopping tunnel (${reason})...`);
    try {
      await tunnel.stop();
      console.log("Tunnel stopped cleanly.");
    } catch (err) {
      console.error("Failed to stop tunnel:", err);
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGINT", () => stop("SIGINT"));
  setTimeout(() => stop("timeout"), TUNNEL_DURATION_MS);
}

main().catch((err) => {
  console.error("Tunnel failed:", err);
  process.exit(1);
});
