# Example: Using `pinggy.listen` with Express

This example demonstrates how to use the new `pinggy.listen` feature to start an Express app and automatically tunnel it with Pinggy in a single step.

## Prerequisites

- Install dependencies:
  ```sh
  npm install express pinggy
  ```

## Usage (async/await)

```js
const express = require("express");
const { listen } = require("pinggy");

const app = express();
app.get("/", (req, res) => res.send("Hello from Express over Pinggy!"));

(async () => {
  // Start the Express app and tunnel it in one step
  const server = await listen(app);

  // Access the tunnel instance via server.tunnel
  console.log("Tunnel public URL:", server.tunnel.urls()[0]);
  console.log("Local server port:", server.address().port);

  // Clean up when done
  // server.close();
  // server.tunnel.stop();
})();
```

## Usage (.then syntax)

```js
const express = require("express");
const { listen } = require("pinggy");

const app = express();
app.get("/", (req, res) => res.send("Hello from Express over Pinggy!"));

listen(app).then((server) => {
  console.log("Tunnel public URL:", server.tunnel.urls()[0]);
  console.log("Local server port:", server.address().port);

  // Clean up when done
  // server.close();
  // server.tunnel.stop();
});
```

## What this does

- Starts your Express app on a random available port.
- Creates a Pinggy tunnel to that port.
- Attaches the tunnel instance to the server as `server.tunnel`.
- Prints the public tunnel URL and the local port.

## Notes

- You can use all Express features as usual.
- You can access all Pinggy tunnel methods via `server.tunnel`.
- Remember to stop the server and tunnel when done to free resources.
