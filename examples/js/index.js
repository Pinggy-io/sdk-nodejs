const { pinggy } = require("@pinggy/pinggy");

(async () => {
  console.log("Starting Pinggy tunnel forwarding to localhost:7878");
  const options = {
    forwarding: "localhost:7878",
  };

  // Create and start tunnel using forward method
  const tunnel = await pinggy.forward(options);

  console.log("Tunnel URLs:", await tunnel.urls());
  console.log("Status:", await tunnel.getStatus());
  console.log("Greet Message:", await tunnel.getGreetMessage());

  // Start web debugging interface
  tunnel.startWebDebugging(8080);
  console.log("Web debugging available at: http://localhost:8080");

  // Stop tunnel after 20 seconds
  setTimeout(() => {
    try {
      console.log("Stopping tunnel...");
      tunnel.stop();
      console.log("Tunnel cleanly closed.");
    } catch (err) {
      console.error("Failed to close tunnel:", err);
    }
  }, 20000);
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
