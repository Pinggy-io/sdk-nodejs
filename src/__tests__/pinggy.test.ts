import { PinggySDK } from "../core/pinggy";
import { PinggyOptions } from "../types";

describe("PinggySDK", () => {
  let sdk: PinggySDK;

  beforeAll(() => {
    const options: PinggyOptions = {
      forwardTo: "localhost:3000",
      sniServerName: "t.pinggy.io",
      // token: process.env.TUNNEL_TOKEN_SUB,
    };
    sdk = new PinggySDK(options);
  });

  afterAll(async () => {
    // Cleanup any resources
    if (sdk) {
      // Add any necessary cleanup here
    }
  });

  test("should get server address", () => {
    const serverAddress = sdk.getServerAddress();
    expect(serverAddress).toBe("t.pinggy.io:443");
  });

  test("should get SNI server name", () => {
    const sniServerName = sdk.getSniServerName();
    expect(sniServerName).toBe("t.pinggy.io");
  });

  test("should start the tunnel", async () => {
    await new Promise<void>((resolve) => {
      sdk.startTunnel();
      // Wait a bit for the tunnel to initialize
      setTimeout(resolve, 1000);
    });
  });

  test("should start web debugging", async () => {
    await new Promise<void>((resolve) => {
      sdk.startWebDebugging(8081);
      // Wait a bit for web debugging to start
      setTimeout(resolve, 1000);
    });
  });
});
