const { pinggy } = require("@pinggy/pinggy");

// Only create the tunnel in the main process, not in forked child processes
const makeListener = process.send === undefined;
let host = "localhost";
let port = process.env.PORT || "3000";

process.argv.forEach((item, index) => {
  if (["--hostname", "-H"].includes(item)) host = process.argv[index + 1];
  if (["--port", "-p"].includes(item)) port = process.argv[index + 1];
});

async function setupPinggy() {
  const tunnel = await pinggy.forward({
    tunnelType: ["http"],
    forwarding: `${host}:${port}`,
  });
  const urls = tunnel.urls();
  console.log(
    `Forwarding to: ${host}:${port} from ingress at: ${
      urls.length ? urls[0] : "(no url)"
    }`
  );
}

if (makeListener) setupPinggy();
