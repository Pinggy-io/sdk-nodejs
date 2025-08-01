// See README.md for full documentation and more usage notes
const express = require("express");
const { listen } = require("@pinggy/pinggy");

const app = express();

app.get("/", (req, res) => res.send("Hello from Express over Pinggy!"));

// Define more routes

listen(app, {
  /* you can add PinggyOptions here, e.g. token: "..." */
}).then((server) => {
  console.log("Tunnel public URL:", server.tunnel.urls()[0]);
  console.log("Local server port:", server.address().port);

  // Clean up when done
  // server.close();
  // server.tunnel.stop();
});
