/**
 * Type definitions for the Pinggy SDK.
 *
 * This module contains all the TypeScript interface definitions and type aliases
 * used throughout the Pinggy SDK for type safety and API documentation.
 *
 * @packageDocumentation
 */

/**
 * Configuration for modifying HTTP headers in tunnel requests.
 *
 * @group Interfaces
 * @public
 *
 * @example
 * ```typescript
 * // Add a custom header
 * { key: "X-Custom-Header", value: "my-value", action: "add" }
 *
 * // Remove a header
 * { key: "X-Unwanted-Header", action: "remove" }
 *
 * // Update an existing header
 * { key: "User-Agent", value: "MyApp/1.0", action: "update" }
 * ```
 */
export interface HeaderModification {
  /** The header key. */
  key: string;

  /**
   * The header value (optional, required for add/update).
   */
  value?: string;

  /**
   * The action to perform: add, remove, or update.
   */
  action: "add" | "remove" | "update";
}

/**
 * Configuration options for creating Pinggy tunnels.
 *
 * @group Interfaces
 * @public
 * @example
 * ```typescript
 * const options: PinggyOptions = {
 *   forwardTo: "localhost:3000",
 *   type: "http",
 *   debug: true,
 *   basicAuth: { "user": "password" }
 * };
 * ```
 */
export interface PinggyOptions {
  /**
   * Authentication token for the tunnel.
   * @example "tk_123abc456def"
   */
  token?: string;
  /**
   * Server address to connect to.
   * @example "connect.pinggy.io"
   */
  serverAddress?: string;
  /**
   * SNI server name for SSL/TLS.
   * @example "example.com"
   */
  sniServerName?: string;
  /**
   * Local address to forward traffic to.
   * @example "localhost:3000"
   */
  forwardTo?: string;
  /**
   * Enable debug logging for this tunnel instance.
   * @default false
   */
  debug?: boolean;
  /**
   * Local port for web debugger.
   * @example 8080
   */
  debuggerPort?: number;
  /**
   * Tunnel protocol type.
   * @default "http"
   */
  type?: "tcp" | "tls" | "http" | "udp";
  /**
   * List of whitelisted IP addresses that can access the tunnel.
   * @example ["192.168.1.1", "10.0.0.1"]
   */
  ipWhitelist?: string[];
  /**
   * Basic authentication credentials (username: password).
   * @example { "admin": "secret123", "user": "password" }
   */
  basicAuth?: Record<string, string>;
  /**
   * List of bearer authentication tokens.
   * @example ["token123", "token456"]
   */
  bearerAuth?: string[];
  /**
   * List of header modification rules.
   * @see {@link HeaderModification}
   */
  headerModification?: HeaderModification[];
  /**
   * Enable X-Forwarded-For header to pass client IP information.
   * @default false
   */
  xff?: boolean;
  /**
   * Only allow HTTPS connections to the tunnel.
   * @default false
   */
  httpsOnly?: boolean;
  /**
   * Enable localServerTls (connecting to local https server). Specify SNI value.
   * @example "localhost"
   */
  localServerTls?: string;
  /**
   * Forward the full request URL to the backend service.
   * @default false
   */
  fullRequestUrl?: boolean;
  /**
   * Allow CORS preflight (OPTIONS) requests.
   * @default false
   */
  allowPreflight?: boolean;
  /**
   * Disable reverse proxy behavior.
   * @default false
   */
  noReverseProxy?: boolean;
  /**
   * Optional command prefix for the tunnel.
   * @example "--tcp"
   */
  cmd?: string;
  /**
   * Whether to use SSL for tunnel setup.
   * @default false
   */
  ssl?: boolean;
  /**
   * Force specific tunnel settings or bypass certain restrictions.
   * @default false
   */
  force?: boolean;
}

/**
 * Interface for the native Pinggy addon methods.
 * This interface defines all the low-level methods for interacting with the native Pinggy library.
 *
 * @group Interfaces
 * @internal
 */
export interface PinggyNative {
  /** Create a new config and return its reference. */
  createConfig(): number;
  /** Set the argument string for a config. */
  configSetArgument: (configRef: number, arg: string) => void;
  /** Get the argument string for a config. */
  configGetArgument(configRef: number): string;
  /** Set the authentication token for a config. */
  configSetToken(configRef: number, token: string): void;
  /** Set the server address for a config. */
  configSetServerAddress(configRef: number, address: string): void;
  /** Set the SNI server name for a config. */
  configSetSniServerName(configRef: number, name: string): void;
  /** Set the TCP forwarding address for a config. */
  configSetTcpForwardTo(configRef: number, address: string): void;
  /** Set the UDP forwarding address for a config. */
  configSetUdpForwardTo(configRef: number, address: string): void;
  /** Set the tunnel type for a config. */
  configSetType(configRef: number, type: string): void;
  /** Set the UDP tunnel type for a config. */
  configSetUdpType(configRef: number, type: string): void;
  /** Set SSL configuration for a config. */
  configSetSsl(configRef: number, ssl: boolean): void;
  /** Set force configuration for a config. */
  configSetForce(configRef: number, force: boolean): void;
  /** Get force configuration for a config. */
  configGetForce(configRef: number): boolean;
  /** Get the authentication token for a config. */
  configGetToken(configRef: number): string;
  /** Get the server address for a config. */
  configGetServerAddress(configRef: number): string;
  /** Get the SNI server name for a config. */
  configGetSniServerName(configRef: number): string;
  /** Get the TCP forwarding address for a config. */
  configGetTcpForwardTo(configRef: number): string;
  /** Get the UDP forwarding address for a config. */
  configGetUdpForwardTo(configRef: number): string;
  /** Get the tunnel type for a config. */
  configGetType(configRef: number): string;
  /** Get the UDP tunnel type for a config. */
  configGetUdpType(configRef: number): string;
  /** Get SSL configuration for a config. */
  configGetSsl(configRef: number): boolean;
  /** Set the log file path. */
  setLogPath(path: string): void;
  /** Enable or disable logging. */
  setLogEnable(enable: boolean): void;
  /** Initiate a tunnel and return its reference. */
  tunnelInitiate(configRef: number): number;
  /** Connect a tunnel. */
  tunnelConnect(tunnelRef: number): boolean;
  /** Resume a tunnel. */
  tunnelResume(tunnelRef: number): boolean;
  /** Start web debugging for a tunnel. */
  tunnelStartWebDebugging(tunnelRef: number, port: number): void;
  /** Request primary forwarding for a tunnel. */
  tunnelRequestPrimaryForwarding(tunnelRef: number): void;
  /** Request additional forwarding for a tunnel. */
  tunnelRequestAdditionalForwarding(
    tunnelRef: number,
    remoteAddress: string,
    localAddress: string
  ): void;
  /** Set the callback for tunnel authentication. */
  tunnelSetAuthenticatedCallback(tunnelRef: number, callback: () => void): void;
  /** Set the callback for primary forwarding success. */
  tunnelSetPrimaryForwardingSucceededCallback(
    tunnelRef: number,
    callback: (addresses: string[]) => void
  ): void;
  /** Set the callback for primary forwarding failure. */
  tunnelSetPrimaryForwardingFailedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, errorMessage: string) => void
  ): void;
  /** Set the callback for additional forwarding success. */
  tunnelSetAdditionalForwardingSucceededCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      bindAddr: string,
      forwardToAddr: string,
      protocol: string
    ) => void
  ): void;
  /** Set the callback for additional forwarding failure. */
  tunnelSetAdditionalForwardingFailedCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      remoteAddress: string,
      errorMessage: string
    ) => void
  ): void;
  /** Stop a tunnel. */
  tunnelStop(tunnelRef: number): boolean;
  /** Check if a tunnel is active. */
  tunnelIsActive(tunnelRef: number): boolean;
  /** Initialize exception handling. */
  initExceptionHandling(): void;
  /** Get the last exception message. */
  getLastException(): string;
  /** Set the callback for authentication failure. */
  tunnelSetAuthenticationFailedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, errorMessage: string) => void
  ): void;
  /** Set the callback for tunnel errors. */
  tunnelSetOnTunnelErrorCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      errorNo: number,
      error: string,
      recoverable: boolean
    ) => void
  ): void;
  /** Set the callback for tunnel disconnection. */
  tunnelSetOnDisconnectedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, error: string, messages: string[]) => void
  ): void;
  /** Enable or disable debug logging. */
  setDebugLogging(enabled: boolean): void;
  /** Get the Pinggy SDK version. */
  getPinggyVersion(): string;
}

/**
 * Interface for the tunnel configuration object.
 * This interface represents a tunnel configuration that can be used to create and manage tunnels.
 *
 * @group Interfaces
 * @public
 */
export interface Config {
  /** Reference to the native config object. */
  configRef: number;
  /** Set the authentication token. */
  setToken(token: string): void;
  /** Set the server address. */
  setServerAddress(address?: string): void;
  /** Get the server address. */
  getServerAddress(): string | null;
  /** Get the SNI server name. */
  getSniServerName(): string | null;
  /** Get the authentication token. */
  getToken(): string | null;
  /** Set the force configuration. */
  setForce(force: boolean): void;
  /** Get the force configuration. */
  getForce(): boolean | null;
}

/**
 * Interface for tunnel operations.
 * This interface represents a tunnel that can be started, stopped, and managed.
 *
 * @group Interfaces
 * @public
 */
export interface Tunnel {
  /** Reference to the native tunnel object. */
  tunnelRef: number;
  /** Whether the tunnel is authenticated. */
  authenticated: boolean;
  /** Whether primary forwarding is complete. */
  primaryForwardingDone: boolean;
  /** Start the tunnel. */
  start(): void;
  /** Start web debugging. */
  startWebDebugging(listeningPort: number): void;
  /** Request additional forwarding. */
  tunnelRequestAdditionalForwarding(
    remoteAddress: string,
    localAddress: string
  ): void;
  /** Stop the tunnel. */
  tunnelStop(): boolean;
  /** Check if the tunnel is active. */
  tunnelIsActive(): boolean;
}
/**
 * Tunnel lifecycle statuses.
 *
 * @group Enums
 * @public
 */
export enum TunnelStatus {
  IDLE = "idle",
  STARTING = "starting",
  LIVE = "live",
  CLOSED = "closed",
}
