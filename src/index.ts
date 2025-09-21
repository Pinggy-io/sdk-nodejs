/**
 * Main entry point for the Pinggy SDK.
 *
 * @remarks
 * This module provides access to the Pinggy tunnel service functionality.
 *
 * @see {@link Pinggy} for the main tunnel manager singleton (exported as `pinggy`).
 * @see {@link TunnelInstance} for individual tunnel instances.
 * @see {@link PinggyOptions} for tunnel configuration options.
 * @see {@link HeaderModification} for header modification configuration.
 * @see {@link listen} for the utility to expose servers via tunnels.
 */
import { Pinggy } from "./pinggy";
import { PinggyOptions, HeaderModification } from "./pinggyOptions";
import { TunnelInstance } from "./tunnel-instance";
import { Config } from "./bindings/config";
import { Tunnel } from "./bindings/tunnel";

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
 * @see {@link PinggyOptions}
 * @see {@link HeaderModification}
 */
export type { PinggyOptions, HeaderModification } from "./pinggyOptions";

export { listen } from "./utils/listen";
