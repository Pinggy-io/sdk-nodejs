/**
 * Type definitions for the Pinggy SDK.
 *
 * This module contains all the TypeScript interface definitions and type aliases
 * used throughout the Pinggy SDK for type safety and API documentation.
 *
 * @packageDocumentation
 */

import { LogLevel } from "./utils/logger.js";



/**
 * Interface for the native Pinggy addon methods.
 * This interface defines all the low-level methods for interacting with the native Pinggy library.
 *
 * @group Interfaces
 * @internal
 */
export interface PinggyNative {
  // special methods
  /** Set the log file path. */
  setLogPath(path: string): void;
  /** Enable or disable logging. */
  setLogEnable(enable: boolean): void;

  /** Create a new config and return its reference. */
  createConfig(): number;

  // Config setter methods
  /** Set the argument string for a config. */
  configSetArgument: (configRef: number, arg: string) => void;
  /** Set the authentication token for a config. */
  configSetToken(configRef: number, token: string): void;
  /** Set the server address for a config. */
  configSetServerAddress(configRef: number, address: string): void;
  /** Set the SNI server name for a config. */
  configSetSniServerName(configRef: number, name: string): void;
  /** Set SSL configuration for a config. */
  configSetSSL(configRef: number, ssl: boolean): void;
  /** Set force configuration for a config. */
  configSetForce(configRef: number, force: boolean): void;
  /** Set auto-reconnect configuration for a config. */
  configSetAutoReconnect(configRef: number, autoReconnect: boolean): void;
  /** Set max reconnect attempts configuration for a config. */
  configSetMaxReconnectAttempts(configRef: number, maxReconnectAttempts: number): void;
  /** Set reconnect interval configuration for a config. */
  configSetReconnectInterval(configRef: number, reconnectInterval: number): void;
  /** Set HTTPS-only configuration for a config. */
  configSetHttpsOnly(configRef: number, httpsOnly: boolean): void;
  /** Set IP whitelist configuration for a config. */
  configSetIpWhiteList(configRef: number, ipWhiteList: string): void;
  /** Set the X-Forwarded-For header for a config. */
  configSetXForwardedFor(configRef: number, xForwardedFor: boolean): void;
  /** Set the Original-Request-URL header for a config. */
  configSetOriginalRequestUrl(configRef: number, originalRequestUrl: boolean): void;
  /** Set the Allow-Preflight configuration for a config. */
  configSetAllowPreflight(configRef: number, allowPreflight: boolean): void;
  /** Set the no-reverse-proxy configuration for a config. */
  configSetReverseProxy(configRef: number, noReverseProxy: boolean): void;
  /** Set the basic authentication configuration for a config. */
  configSetBasicAuths(configRef: number, auths: string): void;
  /** Set the bearer authentication configuration for a config. */
  configSetBearerTokenAuths(configRef: number, tokens: string): void;
  /** Set the header modification configuration for a config. */
  configSetHeaderModification(configRef: number, headers: string): void;
  /** Set local server TLS configuration for a config. */
  configSetLocalServerTls(configRef: number, tls: string): void;
  /**
   *  * @brief Adds a new forwarding rule to the tunnel configuration.
 *
 * This function allows you to specify how incoming connections to a `binding_url`
 * on the Pinggy server should be forwarded to a `forward_to` address on your local machine.
 *
 * @param config          Reference to the tunnel config object.
 * @param forwarding_type Null-terminated string specifying the type of forwarding.
 *                        Valid types are "http", "tcp", "udp", "tls", "tlstcp".
 *                        If an empty string or NULL is provided, "http" is assumed.
 * @param binding_url     Null-terminated string specifying the remote address to bind to.
 *                        This can be a domain name, a domain:port combination, or just a port.
 *                        Examples: "example.pinggy.io", "example.pinggy.io:8080", ":80".
 *                        If empty or NULL, the server will assign a default binding.
 * @param forward_to      Null-terminated string specifying the local address to forward to.
 *                        This can be a URL (e.g., "http://localhost:3000"), an IP address
 *                        (e.g., "127.0.0.1:8000"), or just a port (e.g., ":5000").
 *                        If the schema (e.g., "http://") and host are omitted, "localhost"
 *                        is assumed. For example, ":3000" becomes "http://localhost:3000"
 *                        for HTTP forwarding.
 *                        If `forwarding_type` is "http" and `forward_to` specifies an "https"
 *                        schema (e.g., "https://localhost:443"), this implicitly enables
 *                        `local_server_tls` for this specific forwarding rule.
 * @return                pinggy_true on success, pinggy_false on failure.
  */
  configAddForwarding(configRef: number, forwardingType: string, bindingUrl: string, forwardTo: string): void;

  /** Add forwarding simple 
   * Examples:
   * `pinggy_config_add_forwarding_simple(config, "3000")` will be interpreted as
   * `pinggy_config_add_forwarding(config, "http", "", "http://localhost:3000")`.
   * `pinggy_config_add_forwarding_simple(config, "tcp://localhost:22")` will be interpreted as
   * `pinggy_config_add_forwarding(config, "tcp", "", "tcp://localhost:22")`.
   * `pinggy_config_add_forwarding_simple(config, "https://8080")` will be interpreted as
   * `pinggy_config_add_forwarding(config, "http", "", "https://localhost:8080")`
   */
  configAddForwardingSimple(configRef: number, forwardTo: string): void;

  /**
 * @brief Sets multiple forwarding rules for the tunnel configuration.
 *
 * This function allows you to define multiple forwarding rules either as a single
 * simplified forwarding string (similar to `pinggy_config_add_forwarding_simple`)
 * or as a JSON array of forwarding objects.
 *
 * If `forwardings` is a single string, it should follow the format
 * `[forwarding_type://][localhost:]port`.
 *
 * If `forwardings` is a JSON string, it should be an array of objects, where each
 * object defines a forwarding rule with the following properties:
 * - `type`: (Optional) The type of forwarding (e.g., "http", "tcp", "udp", "tls", "tlstcp").
 *   Defaults to "http" if not specified.
 * - `listenAddress`: (Optional) The remote address to bind to. Format: `[host][:port]`.
 *   An empty string or undefined means the server will assign a default binding.
 *   The hostname is ignored for TCP and UDP tunnels. Any schema provided will be ignored.
 * - `address`: The local address to forward to. Format: `[protocol://][host]:port`.
 *   The `protocol` is primarily used to determine if `local_server_tls` should be
 *   enabled for this specific rule (e.g., `https://`). It is ignored otherwise.
 *
 * @param config      Reference to the tunnel config object.
 * @param forwardings Null-terminated string representing either a single simplified
 *                    forwarding rule or a JSON array of forwarding rule objects.
 */
  configSetForwardings(configRef: number, forwardings: string): void;

  /** Set webdebugger enabled status */
  configSetWebdebugger(configRef: number, enabled: boolean): void;
  /** Set webdebugger address */
  configSetWebdebuggerAddr(configRef: number, addr: string): void;
  /** Reset all forwardings for a config. */
  configResetForwardings(configRef: number): void;

  // Config getter methods
  /** Get the argument string for a config. */
  configGetArgument(configRef: number): string;
  /** Get auto-reconnect configuration for a config. */
  configGetAutoReconnect(configRef: number): boolean;
  /** Get max reconnect attempts configuration for a config. */
  configGetMaxReconnectAttempts(configRef: number): number;
  /** Get reconnect interval configuration for a config. */
  configGetReconnectInterval(configRef: number): number;
  /** Get force configuration for a config. */
  configGetForce(configRef: number): boolean;
  /** Get the authentication token for a config. */
  configGetToken(configRef: number): string;
  /** Get the server address for a config. */
  configGetServerAddress(configRef: number): string;
  /** Get the SNI server name for a config. */
  configGetSniServerName(configRef: number): string;
  /** Get SSL configuration for a config. */
  configGetSsl(configRef: number): boolean;
  /** Get HTTPS-only configuration for a config. */
  configGetHttpsOnly(configRef: number): boolean;
  /** Get the IP whitelist for a config. */
  configGetIpWhiteList(configRef: number): string;
  /** Get the X-Forwarded-For header configuration for a config. */
  configGetXForwardedFor(configRef: number): boolean;
  /** Get the Original-Request-URL header configuration for a config. */
  configGetOriginalRequestUrl(configRef: number): boolean;
  /** Get the Allow-Preflight configuration for a config. */
  configGetAllowPreflight(configRef: number): boolean;
  /** Get the reverse-proxy configuration for a config. */
  configGetReverseProxy(configRef: number): boolean;
  /** Get the bearer authentication configuration for a config. */
  configGetBearerTokenAuths(configRef: number): string;
  /** Get the basic authentication configuration for a config. */
  configGetBasicAuths(configRef: number): string;
  /** Get the header modification configuration for a config. */
  configGetHeaderModification(configRef: number): string;
  /** Get local server TLS configuration for a config. */
  configGetLocalServerTls(configRef: number): string;
  /** Get tunnel Forwarding details */
  configGetForwarding(configRef: number): string;
  /** Get webdebugger enabled status */
  configGetWebdebugger(configRef: number): boolean;
  /** Get webdebugger address */
  configGetWebdebuggerAddr(configRef: number): string;

  /** Initiate a tunnel and return its reference. */
  tunnelInitiate(configRef: number): number;
  /** Starts and serves the tunnel, blocking indefinitely until stopped. */
  tunnelStart(tunnelRef: number): boolean;
  /** It is similar to resume. However, it also start the the tunnel if not started.*/
  tunnelStartNonBlocking(tunnelRef: number): boolean;
  /** Resume a tunnel. */
  tunnelResume(tunnelRef: number): boolean;
  /** Resume a tunnel with timeout */
  tunnelResumeWithTimeout(tunnelRef: number, timeout: number): boolean;

  /** Start web debugging for a tunnel.
   *  @param tunnel         Reference to the tunnel object.
   *  @param listening_addr listening addr for the webDebugger. Keep it empty for automatic selection.
   *  Example: "localhost:4300" specify host:port
   */
  tunnelStartWebDebugging(tunnelRef: number, listeningAddr: string): number;

  /** Request additional forwarding for a tunnel. */
  tunnelRequestAdditionalForwarding(
    tunnelRef: number,
    remoteAddress: string,
    localAddress: string
  ): void;

  /** Stop a tunnel. */
  tunnelStop(tunnelRef: number): boolean;
  /** Check if a tunnel is active. */
  tunnelIsActive(tunnelRef: number): boolean;

  /** Initialize exception handling. */
  initExceptionHandling(): void;
  /** Get the last exception message. */
  getLastException(): string;

  /** Enable or disable debug logging. */
  setDebugLogging(enabled: boolean): void;
  /** Get the Pinggy SDK version. */
  getPinggyVersion(): string;
  /** Get the tunnel greet message. */
  getTunnelGreetMessage(tunnelRef: number): string;
  /** Get the tunnel state. */
  getTunnelState(tunnelRef: number): TunnelState;
  /** Get the web debugging address for a tunnel. */
  getTunnelWebDebuggingAddress(tunnelRef: number): string;
  /** Get the web debugging port for a tunnel. */
  getTunnelWebDebuggingPort(tunnelRef: number): number;
  /** start the tunnel usage update. */
  startTunnelUsageUpdate(tunnelRef: number): void;
  /** stop the tunnel usage update. */
  stopTunnelUsageUpdate(tunnelRef: number): void;
  /** get the tunnel usages. */
  getTunnelUsages(tunnelRef: number): string;

  //----------------------Tunnel Callbacks------------------

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

  /** Set the callback for additional forwarding success. */
  tunnelSetAdditionalForwardingSucceededCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      bindAddr: string,
      forwardToAddr: string,
    ) => void
  ): void;
  /** Set the callback for additional forwarding failure. */
  tunnelSetAdditionalForwardingFailedCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      bindAddress: string,
      forwardToAddr: string,
      errorMessage: string
    ) => void
  ): void;
  /** Set the callback for forwarding changes. */
  tunnelSetOnTunnelForwardingChangedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, urlMap: string) => void
  ): void;
  /** Set the callback for usage updates. */
  tunnelSetOnUsageUpdateCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, usageJson: string) => void
  ): void;
  /** Set the callback for reconnection failed. */
  tunnelSetOnReconnectionFailedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number) => void
  ): void;
  /** Set the callback for reconnection completed. */
  tunnelSetOnReconnectionCompletedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, urls: string[]) => void
  ): void;
  /** Set the callback for will reconnect event. */
  tunnelSetOnWillReconnectCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, error: string, numMsgs: number, messages: string[]) => void
  ): void;
  /** Registers a callback for when primary forwarding fails. */
  tunnelSetOnTunnelFailedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, msg: string) => void
  ): void;

  /** Registers a callback for when primary forwarding is successfully established. */

  tunnelSetEstablishedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, urls: string[]) => void
  ): void;
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
  startWebDebugging(listeningAddr: string): void;
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
 * Maps to the native pinggy_tunnel_state_t enum.
 * @public
 */
export enum TunnelState {
  Invalid = 0,
  Initial = 1,
  Started = 2,
  ReconnectInitiated = 3,
  Reconnecting = 4,
  Connecting = 5,
  Connected = 6,
  SessionInitiating = 7,
  SessionInitiated = 8,
  Authenticating = 9,
  Authenticated = 10,
  ForwardingInitiated = 11,
  ForwardingSucceeded = 12,
  Stopped = 13,
  Ended = 14,
}

/**
 * Converts a TunnelState enum value to its string representation.
 * @param state - The TunnelState enum value
 * @returns The string name of the state (e.g., "Invalid", "Connecting", "ForwardingSucceeded")
 * @public
 */
export function tunnelStateToString(state: TunnelState): string {
  switch (state) {
    case TunnelState.Invalid:
      return "Invalid";
    case TunnelState.Initial:
      return "Initial";
    case TunnelState.Started:
      return "Started";
    case TunnelState.ReconnectInitiated:
      return "ReconnectInitiated";
    case TunnelState.Reconnecting:
      return "Reconnecting";
    case TunnelState.Connecting:
      return "Connecting";
    case TunnelState.Connected:
      return "Connected";
    case TunnelState.SessionInitiating:
      return "SessionInitiating";
    case TunnelState.SessionInitiated:
      return "SessionInitiated";
    case TunnelState.Authenticating:
      return "Authenticating";
    case TunnelState.Authenticated:
      return "Authenticated";
    case TunnelState.ForwardingInitiated:
      return "ForwardingInitiated";
    case TunnelState.ForwardingSucceeded:
      return "ForwardingSucceeded";
    case TunnelState.Stopped:
      return "Stopped";
    case TunnelState.Ended:
      return "Ended";
    default:
      return `Unknown(${state})`;
  }
}

/**
 * @deprecated Use TunnelState instead
 * Legacy tunnel status enum for backward compatibility
 */
export enum TunnelStatus {
  IDLE = "idle",
  STARTING = "starting",
  LIVE = "live",
  CLOSED = "closed",
}

export enum workerMessageType {
  Init = "init",
  Call = "call",
  Response = "response",
  Callback = "callback",
  RegisterCallback = "registerCallback",
  EnableLogger = "enableLogger",
  GetTunnelConfig = "getConfig"
}

export type WorkerMessage =
  | { type: workerMessageType.Init; success: boolean; error: string | null }
  | { type: workerMessageType.Call; id: string; target: "config" | "tunnel"; method: string; args: any[] }
  | { type: workerMessageType.Response; id: string; result?: any; error?: string }
  | { type: workerMessageType.Callback; event: CallbackType; data: any }
  | { type: workerMessageType.RegisterCallback; event: CallbackType }
  | { type: workerMessageType.EnableLogger; enabled: boolean, logLevel: LogLevel, logFilePath: string | null }
  | { type: workerMessageType.GetTunnelConfig; id: string };

export type PendingCall = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

export enum CallbackType {
  TunnelDisconnected = "tunnelDisconnected",
  TunnelError = "tunnelError",
  TunnelUsageUpdate = "tunnelUsage",
  TunnelAdditionalForwarding = "tunnelAdditionalForwarding",
  TunnelPrimaryForwarding = "tunnelPrimaryForwarding",
  TunnelAuthenticated = "tunnelAuthenticated"
}

/**
 * @group Types
 * @public
 */
export type TunnelUsageType = {
  elapsedTime: number;
  numLiveConnections: number;
  numTotalConnections: number;
  numTotalReqBytes: number;
  numTotalResBytes: number;
  numTotalTxBytes: number;
};

export type CallbackPayloadMap = {
  [CallbackType.TunnelUsageUpdate]: TunnelUsageType;
  [CallbackType.TunnelError]: {
    errorNo: number;
    error: string;
    recoverable: boolean;
  };
  [CallbackType.TunnelDisconnected]: {
    error: string;
    messages: string[];
  };
  [CallbackType.TunnelAuthenticated]: string;
  [CallbackType.TunnelPrimaryForwarding]: {
    message: string;
    address?: string[];
  };
  [CallbackType.TunnelAdditionalForwarding]: {
    bindAddress: string;
    forwardToAddr: string;
    errorMessage: string | null;
  };
};


// Callback Signatures

export type CallbackMap = {
  [K in CallbackType]: (payload: CallbackPayloadMap[K]) => void;
};

export type Callback<K extends CallbackType> = CallbackMap[K];




