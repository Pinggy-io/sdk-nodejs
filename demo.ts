import { pinggy, PinggyOptions } from "./src/index";

(async () => {
  const options: PinggyOptions = {
    forwardTo: "localhost:5173",
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
    // headerModification: ["x-custom-header: value"],
  };
  const tunnel = pinggy.createTunnel(options);
  await tunnel.start();

  console.log("Tunnel addresses:", tunnel.urls());

  tunnel.startWebDebugging(3001);

  // console.log("about to stop tunnel");
  // setTimeout(async () => {
  //   try {
  //     console.log("Stopping tunnel...");
  //     await pinggy.close();
  //     console.log("Tunnel cleanly closed.");
  //   } catch (err) {
  //     console.error("Failed to close tunnel:", err);
  //   }
  // }, 15000);
})();
