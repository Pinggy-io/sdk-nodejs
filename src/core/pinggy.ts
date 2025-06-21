// core/pinggy.ts
import { PinggyNative, PinggyOptions } from "../types";
import { TunnelInstance } from "./tunnel-instance";
const binary = require("@mapbox/node-pre-gyp");
const path = require("path");

export class Pinggy {
  private static _instance: Pinggy;
  private static addon: PinggyNative = require(binary.find(
    path.resolve(path.join(__dirname, "../package.json"))
  ));
  private tunnels: Set<TunnelInstance> = new Set();
  private constructor() {}
  public static get instance(): Pinggy {
    if (!this._instance) {
      this._instance = new Pinggy();
    }
    return this._instance;
  }
  public createTunnel(options: PinggyOptions): TunnelInstance {
    const tunnel = new TunnelInstance(Pinggy.addon, options);
    this.tunnels.add(tunnel);
    return tunnel;
  }
  public forward(options: PinggyOptions): Promise<TunnelInstance> {
    const tunnel = this.createTunnel(options);
    return tunnel.start().then(() => tunnel);
  }
  public getAllTunnels(): TunnelInstance[] {
    return Array.from(this.tunnels);
  }
  public closeAllTunnels(): void {
    for (const tunnel of this.tunnels) {
      if (tunnel.isActive()) {
        tunnel.stop();
      }
    }
    this.tunnels.clear();
  }
}
