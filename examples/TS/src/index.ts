import { pinggy, PinggyOptions } from "pinggy-test";

(async () => {
  // const tunnel = await pinggy.forward({ forwardTo: "localhost:5000" });

  // console.log("Tunnel URLs:", tunnel.urls());

  // setTimeout(() => {
  //   try {
  //     console.log("Stopping tunnel...");
  //     tunnel.stop();
  //     console.log("Tunnel cleanly closed.");
  //   } catch (err) {
  //     console.error("Failed to close tunnel:", err);
  //   }
  // }, 5000);

  const tunnel1 = pinggy.createTunnel({ forwardTo: "localhost:3000" });
  const tunnel2 = pinggy.createTunnel({ forwardTo: "localhost:4000" });
  await tunnel2.start();
  await tunnel1.start();
  console.log("Tunnel 1 URLs:", tunnel1.urls());
  console.log("Tunnel 2 URLs:", tunnel2.urls());

  // get status
  const status1 = tunnel1.getStatus();
  const status2 = tunnel2.getStatus();
  console.log("Tunnel 1 status:", status1);
  console.log("Tunnel 2 status:", status2);

  const allTunnels = pinggy.getAllTunnels();
  console.log("All tunnels:", allTunnels);

  // setTimeout(() => {
  //   try {
  //     pinggy.closeAllTunnels();
  //     console.log("All tunnels closed.");
  //   } catch (err) {
  //     console.error("Failed to close all tunnels:", err);
  //   }
  // }, 10000);

  // setTimeout(() => {
  //   try {
  //     console.log("Stopping tunnel 1...");
  //     tunnel1.stop();
  //     console.log("Tunnel 1 cleanly closed.");
  //   } catch (err) {
  //     console.error("Failed to close tunnel 1:", err);
  //   }
  // }, 5000);

  // setTimeout(() => {
  //   try {
  //     console.log("Stopping tunnel 2...");
  //     tunnel2.stop();
  //     console.log("Tunnel 2 cleanly closed.");
  //   } catch (err) {
  //     console.error("Failed to close tunnel 2:", err);
  //   }
  // }, 20000);
})();

// Additional options for the tunnel can be passed in the PinggyOptions object:
// token: "terminateAtUsages",
// ssl: false,
// type: "http", // defaults to http if not provided
// fullRequestUrl: true,
// allowPreflight: true,
// noReverseProxy: true,
// httpsOnly: true,
// xff: true,
// bearerAuth: ["hello"],
// basicAuth: { username: "password" },
// ipWhitelist: [""],
// headerModification: {
//   key: "x-custom-header",
//   value: "value",
//   action: "add", // or "remove" or "update"
// },
