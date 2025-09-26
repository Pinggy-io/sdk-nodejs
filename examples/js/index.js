const { pinggy } = require("@pinggy/pinggy");

(async () => {
  const options = {
    forwarding: "localhost:7878",
  };

  // Create and start tunnel using forward method
  const tunnel = await pinggy.forward(options);

  console.log("Tunnel URLs:", tunnel.urls());
  console.log("Status:", tunnel.getStatus());
  console.log("Greet Message:", tunnel.getGreetMessage());

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
// TunnelType: "http", // defaults to http if not provided
// originalRequestUrl: true,
// allowPreflight: true,
// reverseProxy: true,
// httpsOnly: true,
// xForwardedFor: true,
// bearerTokenAuth: ["hello"],
// basicAuth: { username: "password" },
// ipWhitelist: [""],
// headerModification: {
//   key: "x-custom-header",
//   value: "value",
//   type: "add", // or "remove" or "update"
// },
