/**
 * Main entry point for the Pinggy SDK.
 *
 * @remarks
 * This module provides access to the Pinggy tunnel service functionality.
 *
 * @see {@link Pinggy} for the main tunnel manager singleton (exported as `pinggy`).
 * @see {@link TunnelInstance} for individual tunnel instances.
 * @see {@link PinggyOptionsType} for tunnel configuration options.
 * @see {@link HeaderModification} for header modification configuration.
 * @see {@link listen} for the utility to expose servers via tunnels.
 */
import { Pinggy } from "./pinggy.js";
import { PinggyOptionsType, HeaderModification } from "./pinggyOptions.js";
import { TunnelInstance } from "./tunnel-instance.js";
import { Config } from "./bindings/config.js";
import { Tunnel } from "./bindings/tunnel.js";

/**
 * The main Pinggy tunnel manager singleton.
 *
 * @group Variables
 * @public
 * @see {@link Pinggy}
 */
const pinggy = Pinggy.instance;

export { pinggy, TunnelInstance, Config, Tunnel };

/**
 * Re-export of tunnel configuration option types and interfaces.
 *
 * @see {@link PinggyOptionsType}
 * @see {@link HeaderModification}
 */
export type { PinggyOptionsType as PinggyOptions, HeaderModification, ForwardingEntry, BasicAuthItem, Optional } from "./pinggyOptions.js";
export { TunnelType } from "./pinggyOptions.js"
export type { TunnelStatus, PinggyNative, TunnelUsageType } from "./types.js";
export { TunnelState, tunnelStateToString } from "./types.js";
export { LogLevel } from "./utils/logger.js"

export { listen } from "./utils/listen.js";
