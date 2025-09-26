import { pinggy } from "@pinggy/pinggy";

(async () => {
  console.log("Quick demonstration - creating a simple tunnel:");
  try {
    const tunnel = await pinggy.forward({ forwarding: "localhost:3000" });
    console.log("Tunnel created successfully!");
    console.log("URLs:", tunnel.urls());
    console.log("Greet Message:", tunnel.getGreetMessage());

    // Clean up immediately
    setTimeout(() => {
      tunnel.stop();
      console.log("Demo tunnel stopped.");
    }, 2000);
  } catch (error) {
    console.error("Failed to create demo tunnel:", error);
  }
})();
