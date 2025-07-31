#!/usr/bin/env node

const { existsSync } = require("fs");
const { join } = require("path");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: "3000",
    token: undefined as string | undefined,
    serverAddress: undefined as string | undefined,
    sniServerName: undefined as string | undefined,
    debug: undefined as boolean | undefined,
    debuggerPort: undefined as string | undefined,
    type: undefined as "tcp" | "tls" | "http" | "udp" | undefined,
    ipWhitelist: [] as string[],
    basicAuth: {} as Record<string, string>,
    bearerAuth: [] as string[],
    headerModification: [] as any[],
    xff: undefined as boolean | undefined,
    httpsOnly: undefined as boolean | undefined,
    fullRequestUrl: undefined as boolean | undefined,
    allowPreflight: undefined as boolean | undefined,
    noReverseProxy: undefined as boolean | undefined,
    cmd: undefined as string | undefined,
    ssl: undefined as boolean | undefined,
    force: undefined as boolean | undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Original Pinggy CLI compatible flags
    if (arg === "-p" || arg === "--port") {
      options.port = args[++i];
    } else if (arg === "--localport" || arg === "-l") {
      // Extract port from localport (e.g., -l 777 or --localport https://my.domain:445)
      const localAddr = args[++i];
      const portMatch =
        localAddr.match(/:(\d+)$/) || localAddr.match(/^(\d+)$/);
      if (portMatch) {
        options.port = portMatch[1];
      }
    } else if (arg.startsWith("-R")) {
      // Reverse forward tunnel: -R0:localhost:3000
      const mapping = arg.substring(2);
      const parts = mapping.split(":");
      if (parts.length === 3 && parts[1] === "localhost") {
        options.port = parts[2];
      } else {
        console.error(
          `❌ Invalid -R mapping: ${arg}. Use format: -R0:localhost:<port>`
        );
        process.exit(1);
      }
    } else if (arg.startsWith("-L")) {
      // Web debugger: -L4300:localhost:4300
      const mapping = arg.substring(2);
      const parts = mapping.split(":");
      if (parts.length === 3 && parts[1] === "localhost") {
        options.debuggerPort = parts[0]; // Use the first port as debugger port
        options.debug = true;
      } else {
        console.error(
          `❌ Invalid -L mapping: ${arg}. Use format: -L<port>:localhost:<port>`
        );
        process.exit(1);
      }
    } else if (arg === "--token") {
      options.token = args[++i];
    } else if (arg === "--type") {
      const type = args[++i];
      if (["tcp", "tls", "http", "udp"].includes(type)) {
        options.type = type as "tcp" | "tls" | "http" | "udp";
      } else {
        console.error(
          `❌ Invalid type: ${type}. Must be one of: tcp, tls, http, udp`
        );
        process.exit(1);
      }
    } else if (arg === "--debugger" || arg === "-d") {
      options.debuggerPort = args[++i];
      options.debug = true; // Enable debug when debugger port is set
    } else if (arg.startsWith("-w:")) {
      // IP whitelist: -w:192.168.1.0/24,10.0.0.1/32
      const cidrs = arg.substring(3).split(",");
      // Convert CIDR to IP addresses (simplified - real implementation would expand CIDR)
      options.ipWhitelist = cidrs.map((cidr) => cidr.trim());
    } else if (arg.startsWith("b:")) {
      // Basic auth: b:user:pass
      const parts = arg.substring(2).split(":");
      if (parts.length >= 2) {
        const username = parts[0];
        const password = parts.slice(1).join(":"); // Handle passwords with colons
        options.basicAuth[username] = password;
      }
    } else if (arg.startsWith("k:")) {
      // Bearer auth: k:token
      options.bearerAuth.push(arg.substring(2));
    } else if (arg.startsWith("a:")) {
      // Add header: a:header:value
      const parts = arg.substring(2).split(":", 2);
      if (parts.length === 2) {
        options.headerModification.push({
          key: parts[0],
          value: parts[1],
          action: "add",
        });
      }
    } else if (arg.startsWith("r:")) {
      // Remove header: r:header
      options.headerModification.push({
        key: arg.substring(2),
        action: "remove",
      });
    } else if (arg.startsWith("u:")) {
      // Update header: u:header:value
      const parts = arg.substring(2).split(":", 2);
      if (parts.length === 2) {
        options.headerModification.push({
          key: parts[0],
          value: parts[1],
          action: "update",
        });
      }
    } else if (arg === "x:https" || arg === "x:httpsonly") {
      options.httpsOnly = true;
    } else if (arg === "x:noreverseproxy") {
      options.noReverseProxy = true;
    } else if (arg.startsWith("x:localserverTls:")) {
      options.sniServerName = arg.substring(17);
      options.ssl = true;
    } else if (arg.startsWith("x:xff")) {
      options.xff = true;
    } else if (arg === "x:fullurl" || arg === "x:origurl") {
      options.fullRequestUrl = true;
    } else if (arg === "x:passpreflight") {
      options.allowPreflight = true;
    } else if (arg.startsWith("force@")) {
      options.force = true;
      // Extract server address if provided
      const serverAddr = arg.substring(6);
      if (serverAddr) {
        options.serverAddress = serverAddr;
      }
    } else if (arg.endsWith(".pinggy.io")) {
      // Server address: a.pinggy.io, ap.a.pinggy.io, etc.
      options.serverAddress = arg;
    } else if (arg.includes("@") && arg.endsWith(".pinggy.io")) {
      // Handle token@server or type@server
      const [prefix, server] = arg.split("@");
      if (["tcp", "tls", "http", "udp"].includes(prefix)) {
        options.type = prefix as "tcp" | "tls" | "http" | "udp";
      } else {
        options.token = prefix;
      }
      options.serverAddress = server;
    } else if (arg === "-h" || arg === "--help") {
      showHelp();
      process.exit(0);
    } else if (arg === "--v") {
      console.log("0.1.4"); // From package.json
      process.exit(0);
    } else {
      console.error(`❌ Unknown option: ${arg}`);
      console.error("Use --help to see available options");
      process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: pinggy [options] [server]

Basic Options:
  -p, --port <port>             Connect to Pinggy server on specified port
  -l, --localport <addr>        Local address and port to forward (e.g. -l 777)
  -R <mapping>                  Reverse forward tunnel (e.g. -R0:localhost:3000)
  -L <mapping>                  Start web debugger (e.g. -L4300:localhost:4300)
  -d, --debugger <port>         Port for the built-in web debugger
  --token <token>               Authentication token for secure tunnels
  --type <type>                 Tunnel type: http, tcp, tls, udp (default: http)

Server Options:
  <server>                      Server address (e.g. a.pinggy.io, ap.a.pinggy.io)
  <token>@<server>              Connect with token to specific server
  <type>@<server>               Connect with specific type to server
  force@<server>                Force disconnect existing tunnel and reconnect

Security & Access Control:
  -w:<CIDR>[,<CIDR>...]         IP whitelist in CIDR format
  b:<user>:<pass>               Basic auth credentials (repeatable)
  k:<key>                       Bearer/token authentication

Header Manipulation:
  a:<header>:<val>              Add a custom header (repeatable)
  r:<header>                    Remove a header
  u:<header>:<val>              Update header value

Advanced Options:
  x:https, x:httpsonly          Enforce HTTPS only (redirect HTTP to HTTPS)
  x:noreverseproxy              Disable built-in reverse-proxy header injection
  x:localserverTls:<name>       SNI-based TLS to local server
  x:xff[:<header>]              Add X-Forwarded-For header
  x:fullurl, x:origurl          Include original request URL in headers
  x:passpreflight               Pass CORS preflight requests unchanged

General:
  -h, --help                    Show this help message
  --v                           Display version number

Examples (SSH-style):
  pinggy -R0:localhost:3000                        # Basic HTTP tunnel
  pinggy --type tcp -R0:localhost:22               # TCP tunnel for SSH
  pinggy -R0:localhost:8080 -L4300:localhost:4300  # HTTP tunnel with debugger
  pinggy tcp@ap.a.pinggy.io -R0:localhost:22       # TCP tunnel to Asia region

Examples (User-friendly):
  pinggy -p 3000                           # Basic HTTP tunnel
  pinggy --type tcp -p 22                  # TCP tunnel for SSH
  pinggy -l 8080 -d 4300                   # HTTP tunnel with debugger
  pinggy mytoken@a.pinggy.io -p 3000       # Authenticated tunnel
  pinggy -p 80 b:admin:secret              # HTTP tunnel with basic auth
  pinggy -p 443 x:https x:xff              # HTTPS-only with X-Forwarded-For
  pinggy -w:192.168.1.0/24 -p 8080         # IP whitelist restriction
  `);
}

async function main() {
  try {
    const options = parseArgs();

    // Check if native addon exists
    const libPath = join(__dirname, "../lib/addon.node");
    if (!existsSync(libPath)) {
      console.error("Native addon not found.");
      process.exit(1);
    }

    // Dynamic require to avoid loading issues
    let pinggyModule;
    try {
      pinggyModule = require("./index");
    } catch (importError) {
      // Type-guard the import error
      const errorMessage =
        importError instanceof Error
          ? importError.message
          : String(importError);
      console.error("Failed to load pinggy module:", errorMessage);
      process.exit(1);
    }

    // Access the pinggy instance
    const pinggy = pinggyModule.pinggy;

    // Build the tunnel options
    const tunnelOptions: any = {
      forwardTo: `localhost:${options.port}`,
    };

    // Only add options that were explicitly set
    if (options.token) tunnelOptions.token = options.token;
    if (options.serverAddress)
      tunnelOptions.serverAddress = options.serverAddress;
    if (options.sniServerName)
      tunnelOptions.sniServerName = options.sniServerName;
    if (options.debug) tunnelOptions.debug = options.debug;
    if (options.debuggerPort)
      tunnelOptions.debuggerPort = parseInt(options.debuggerPort);
    if (options.type) tunnelOptions.type = options.type;
    if (options.ipWhitelist.length > 0)
      tunnelOptions.ipWhitelist = options.ipWhitelist;
    if (Object.keys(options.basicAuth).length > 0)
      tunnelOptions.basicAuth = options.basicAuth;
    if (options.bearerAuth.length > 0)
      tunnelOptions.bearerAuth = options.bearerAuth;
    if (options.headerModification.length > 0)
      tunnelOptions.headerModification = options.headerModification;
    if (options.xff) tunnelOptions.xff = options.xff;
    if (options.httpsOnly) tunnelOptions.httpsOnly = options.httpsOnly;
    if (options.fullRequestUrl)
      tunnelOptions.fullRequestUrl = options.fullRequestUrl;
    if (options.allowPreflight)
      tunnelOptions.allowPreflight = options.allowPreflight;
    if (options.noReverseProxy)
      tunnelOptions.noReverseProxy = options.noReverseProxy;
    if (options.cmd) tunnelOptions.cmd = options.cmd;
    if (options.ssl) tunnelOptions.ssl = options.ssl;
    if (options.force) tunnelOptions.force = options.force;

    console.log(
      "🚀 Creating tunnel with options:",
      JSON.stringify(tunnelOptions, null, 2)
    );

    const tunnel = await pinggy.forward(tunnelOptions);

    console.log(`✅ Public URLs: ${tunnel.urls().join(", ")}`);
    console.log(`Forwarding to localhost:${options.port}`);

    // Start web debugging if debugger port is specified
    if (options.debuggerPort) {
      const debugPort = parseInt(options.debuggerPort);
      try {
        tunnel.startWebDebugging(debugPort);
        console.log(`Web debugger started on http://localhost:${debugPort}`);
      } catch (debugError) {
        const debugErrorMessage =
          debugError instanceof Error ? debugError.message : String(debugError);
        console.warn(`Failed to start web debugger: ${debugErrorMessage}`);
      }
    }

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n Closing tunnel...");
      tunnel.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      tunnel.stop();
      process.exit(0);
    });
  } catch (error) {
    // Type-guard the main error
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    process.exit(1);
  }
}

main();
