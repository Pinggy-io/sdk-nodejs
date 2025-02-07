const PinggyTunnel = require("./lib/PinggyTunnel");

async function main() {
  // debug
  console.log("in main()");
  const tunnel = new PinggyTunnel({
    serverAddress: "t.pinggy.io:443",
    tcpForwardTo: "localhost:3000",
  });

  //   debug
  console.log("tunnel set up");

  tunnel.setLogPath("./logs.log");

  try {
    // debug
    console.log("trying to connect tunnel");

    const connected = await tunnel.connect();
    if (connected) {
      console.log("Tunnel connected and set up successfully");
      // The tunnel is now connected, authenticated, and polling
      // Your application can continue running here
      // For example, you might want to keep the process alive:
      //   process.on('SIGINT', () => {
      //     console.log('Gracefully shutting down from SIGINT (Ctrl-C)');
      //     // Perform any cleanup if necessary
      //     process.exit();
      //   });
    }
    // debug
    console.log("connected:", connected);
  } catch (error) {
    // debug
    console.log("Error in main:", error);

    if (error.name === "ConfigError") {
      console.error("Configuration error:", error.message);
    } else if (error.name === "TunnelError") {
      console.error("Tunnel error:", error.message);
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
}

main();
