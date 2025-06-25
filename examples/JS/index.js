const { pinggy } = require("pinggy-test");

(async () => {
  const options = {
    forwardTo: "localhost:7878",
  };

  const addresses = await pinggy.startTunnel(options);

  console.log("Tunnel addresses:", addresses);
  console.log("Server address:", pinggy.getServerAddress());

  pinggy.startWebDebugging(8080);

  console.log("about to stop tunnel");
  setTimeout(async () => {
    try {
      console.log("Stopping tunnel...");
      await pinggy.close();
      console.log("Tunnel cleanly closed.");
    } catch (err) {
      console.error("Failed to close tunnel:", err);
    }
  }, 10000);
})();

// Additional configurations can be passed to the "options" object, such as:
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
