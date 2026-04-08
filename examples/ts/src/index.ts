import { LogLevel, pinggy, TunnelConfigurationV1, TunnelType } from "@pinggy/pinggy";

(async () => {
  pinggy.setDebugLogging(true, LogLevel.DEBUG);
  console.log(
    "Quick demonstration - creating a simple tunnel to localhost:3000 for 20 seconds:",
  );
  try {
    const config: TunnelConfigurationV1 = {
      forwarding: [
        {
          type: "http" as TunnelType,
          listenAddress: "",
          address: "http://localhost:8005",
        },
      ],
      serverAddress:"a.pinggy.io:443",
      webDebugger: "localhost:4300",
      token: "",
      autoReconnect:true,
      force: true,
    };


     const tunnel = await pinggy.createTunnel(config);
     await tunnel.start();
     await new Promise((resolve) => setTimeout(resolve, 5000));
     await new Promise((resolve) => setTimeout(resolve, 5000));
     await tunnel.stop();

     await new Promise((resolve) => setTimeout(resolve, 50000));

    // Clean up immediately;
  } catch (error) {
    console.error("Failed to create demo tunnel:", error);
  }
})();
