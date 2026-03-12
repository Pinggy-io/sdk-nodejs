/**
 * Main entry point for the Pinggy SDK.
 *
 * @remarks
 * This module provides access to the Pinggy tunnel service functionality.
 *
 * @see {@link Pinggy} for the main tunnel manager singleton (exported as `pinggy`).
 * @see {@link TunnelInstance} for individual tunnel instances.
 * @see {@link TunnelConfigurationV1} for tunnel configuration options.
 * @see {@link HeaderModification} for header modification configuration.
 * @see {@link listen} for the utility to expose servers via tunnels.
 */
import { Pinggy } from "./pinggy.js";
import { TunnelConfigurationV1, HeaderModification } from "./tunnelConfiguration.js";
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

export { pinggy, Pinggy, TunnelInstance, Config, Tunnel };

/**
 * Re-export of tunnel configuration option types and interfaces.
 *
 * @see {@link TunnelConfigurationV1}
 * @see {@link HeaderModification}
 */
export type { TunnelConfigurationV1, HeaderModification, ForwardingEntry, BasicAuthItem, Optional, RemoteManagementConfig } from "./tunnelConfiguration.js";
export { TunnelType } from "./tunnelConfiguration.js"
export type { TunnelStatus, PinggyNative, TunnelUsageType } from "./types.js";
export { TunnelState, tunnelStateToString } from "./types.js";
export { LogLevel } from "./utils/logger.js"

export { listen } from "./utils/listen.js";
