import { Pinggy } from "./core/pinggy";
import { PinggyOptions } from "./types";
import { TunnelInstance } from "./core/tunnel-instance";

const pinggy = Pinggy.instance;
export { pinggy, TunnelInstance };
export type { PinggyOptions };
export { listen } from "./utils/listen";
