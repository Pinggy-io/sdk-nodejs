import express from "express";
import type { Express } from "express";
import { listen } from "../utils/listen";
import supertest from "supertest";
import type { SuperTest, Test } from "supertest";

describe("pinggy.listen with Express app", () => {
  let server: any;

  afterAll(async () => {
    if (server) {
      server.close();
      if (server.tunnel) await server.tunnel.stop();
    }
  });

  it("should start an Express app, tunnel it, and attach tunnel to server", async () => {
    const app = express();
    app.get("/", (req: any, res: any) => res.send("Hello from Express!"));

    server = await listen(app);
    expect(server).toBeDefined();
    expect(server.tunnel).toBeDefined();
    expect(typeof server.tunnel.urls).toBe("function");
    expect(server.address().port).toBeGreaterThan(0);

    // Test local server
    const localRes = await supertest(
      `http://localhost:${server.address().port}`
    ).get("/");
    expect(localRes.status).toBe(200);
    expect(localRes.text).toBe("Hello from Express!");

    // Optionally, print tunnel URL (public test may not be feasible in CI)
    const urls = server.tunnel.urls();
    expect(Array.isArray(urls)).toBe(true);
    expect(urls.length).toBeGreaterThan(0);
    console.log("Tunnel public URL:", urls[0]);
  });
});
