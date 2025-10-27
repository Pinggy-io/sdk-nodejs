// See README.md for full documentation and more usage notes
const express = require("express");
const { listen } = require("@pinggy/pinggy");

const app = express();

app.get("/", (req, res) => res.send("Hello from Express over Pinggy!"));

// Define more routes

listen(app, {
  /* you can add PinggyOptions here, e.g. token: "..." */
}).then(async (server) => {
  console.log("Tunnel public URL:", await server.tunnel.urls());
  console.log("Local server port:", server.address().port);

  // Clean up when done
  // server.close();
  // server.tunnel.stop();
});
