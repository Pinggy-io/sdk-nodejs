import { pinggy } from "@pinggy/pinggy";

(async () => {
  console.log("Quick demonstration - creating a simple tunnel to localhost:3000 for 20 seconds:");
  try {
    const tunnel = await pinggy.forward({ forwarding: "localhost:3000" });
    console.log("Tunnel created successfully!");
    console.log("URLs:", await tunnel.urls());
    console.log("Greet Message:", await tunnel.getGreetMessage());

    // Clean up immediately
    setTimeout(() => {
      tunnel.stop();
      console.log("Demo tunnel stopped.");
    }, 20000);
  } catch (error) {
    console.error("Failed to create demo tunnel:", error);
  }
})();
