import { Pinggy } from "../core/pinggy";
import { PinggyOptions } from "../types";

describe("Pinggy", () => {
  let tunnel: any;
  let options: PinggyOptions;

  beforeAll(() => {
    options = {
      forwardTo: "localhost:3000",
      sniServerName: "a.pinggy.io",
      // token: process.env.TUNNEL_TOKEN_SUB,
    };
    tunnel = Pinggy.instance.createTunnel(options);
  });

  afterAll(async () => {
    // Cleanup any resources
    if (tunnel) {
      tunnel.stop();
    }
  });

  test("should get server address", () => {
    const serverAddress = tunnel.getServerAddress();
    expect(serverAddress).toBe("a.pinggy.io:443");
  });

  test("should get SNI server name", () => {
    const sniServerName = tunnel.config?.getSniServerName();
    expect(sniServerName).toBe("a.pinggy.io");
  });

  test("should start the tunnel", async () => {
    await new Promise<void>(async (resolve) => {
      await tunnel.start();
      setTimeout(resolve, 1000);
    });
  });

  test("should start web debugging", async () => {
    await new Promise<void>((resolve) => {
      tunnel.startWebDebugging(8081);
      setTimeout(resolve, 1000);
    });
  });
});
