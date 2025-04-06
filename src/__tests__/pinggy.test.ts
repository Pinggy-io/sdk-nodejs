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

  test("should get server address", () => {
    const serverAddress = sdk.getServerAddress();
    expect(serverAddress).toBe("t.pinggy.io:443");
  });

  test("should get SNI server name", () => {
    const sniServerName = sdk.getSniServerName();
    expect(sniServerName).toBe("t.pinggy.io");
  });

  test("should start the tunnel", () => {
    sdk.startTunnel();
  });

  test("should start web debugging", () => {
    sdk.startWebDebugging(8081);
  });
});
