const { pinggy } = require("@pinggy/pinggy");

(async () => {
  const options = {
    forwardTo: "localhost:7878",
  };

  // Create and start tunnel using forward method
  const tunnel = await pinggy.forward(options);

  console.log("Tunnel URLs:", tunnel.urls());
  console.log("Status:", tunnel.getStatus());

  // Start web debugging interface
  tunnel.startWebDebugging(8080);
  console.log("Web debugging available at: http://localhost:8080");

  setTimeout(() => {
    try {
      console.log("Stopping tunnel...");
      tunnel.stop();
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
