const { pinggy, LogLevel } = require("@pinggy/pinggy");

(async () => {
  console.log("Starting Pinggy tunnel forwarding to localhost:7878");
 // pinggy.setDebugLogging(true, LogLevel.DEBUG);
  const options = {
    forwarding: [
      {
        type: "http",
        address: "localhost:7878",

      },
      // {
      //   address: "localhost:8082",
      //   type: "tcp",
      //   listenAddress: "a.test.sysmos.me:18463"
      // },
      //  {
      //   address: "localhost:8081",
      //   type: "http",
      //   listenAddress: "b.test.sysmos.me"
      // }
    ],
    token: "0gRnXarciSB",
    webDebugger: "localhost:8100"
  };


  // Create and start tunnel using forward method
  const tunnel = await pinggy.createTunnel(options);
   console.log("Current Tunnel State:", await tunnel.GetTunnelState());

  tunnel.setTunnelForwardingChangedCallback((data, address) => {
    console.log("Forwarding Changed callback:", data, address);
  });

  tunnel.setTunnelEstablishedCallback((message, urls) => {
    console.log("TunnelEstablished callback",message, urls);
  });

  console.log("webdebug", await tunnel.getWebDebuggerInfo());

  await tunnel.start();

  (async () => {
    for (let i = 0; i < 5; i++) {
      console.log("Current Tunnel State:", await tunnel.GetTunnelState());
      await new Promise(res => setTimeout(res, 1000));
    }
  })();
  console.log("config", await tunnel.getConfig());
  console.log("Tunnel URLs:", await tunnel.urls());

  console.log("Status:", await tunnel.getStatus());
  console.log("Greet Message:", await tunnel.getGreetMessage());

  // Start web debugging interface
  // tunnel.startWebDebugging("http://localhost:8080");
  // console.log("Web debugging available at: http://localhost:8080");

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
