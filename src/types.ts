/**
 * Type definitions for the Pinggy SDK.
 *
 * This module contains all the TypeScript interface definitions and type aliases
 * used throughout the Pinggy SDK for type safety and API documentation.
 *
 * @packageDocumentation
 */


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
  /** Set auto-reconnect configuration for a config. */
  configSetAutoReconnect(configRef: number, autoReconnect: boolean): void;
  /** Set max reconnect attempts configuration for a config. */
  configSetMaxReconnectAttempts(configRef: number, maxReconnectAttempts: number): void;
  /** Set reconnect interval configuration for a config. */
  configSetReconnectInterval(configRef: number, reconnectInterval: number): void;
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
  /** Get local server TLS configuration for a config. */
  configGetLocalServerTls(configRef: number): string;
  /** Get the header modification configuration for a config. */
  configGetHeaderModification(configRef: number): string;
  /** Get the bearer authentication configuration for a config. */
  configGetBearerTokenAuths(configRef: number): string;
  /** Get the basic authentication configuration for a config. */
  configGetBasicAuths(configRef: number): string;
  /** Get the X-Forwarded-For header configuration for a config. */
  configGetXForwardedFor(configRef: number): boolean;
  /** Get the Original-Request-URL header configuration for a config. */
  configGetOriginalRequestUrl(configRef: number): boolean;
  /** Get the Allow-Preflight configuration for a config. */
  configGetAllowPreflight(configRef: number): boolean;
  /** Get the reverse-proxy configuration for a config. */
  configGetReverseProxy(configRef: number): boolean;
  /** Get the IP whitelist for a config. */
  configGetIpWhiteList(configRef: number): string;
  /** Get HTTPS-only configuration for a config. */
  configGetHttpsOnly(configRef: number): boolean;
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
  tunnelStartWebDebugging(tunnelRef: number, port: number): number;
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
  /** Get the tunnel greet message. */
  getTunnelGreetMessage(tunnelRef: number): string;
  /** start the tunnel usage update. */
  startTunnelUsageUpdate(tunnelRef: number): void;
  /** stop the tunnel usage update. */
  stopTunnelUsageUpdate(tunnelRef: number): void;
  /** get the tunnel usages. */
  getTunnelUsages(tunnelRef: number): string;
  /** Set the callback for forwarding changes. */
  tunnelSetOnForwardingChangedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, forwardToAddr: string) => void
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

export enum workerMessageType {
  Ready = "ready",
  InitError = "initError",
  Call = "call",
  Response = "response",
  Callback = "callback",
  RegisterCallback = "registerCallback",
  enableLogger = "enableLogger"
}

export type WorkerMessages =
  | { type: workerMessageType.Ready }
  | { type: workerMessageType.InitError; error: string }
  | { type: workerMessageType.Call; id: string; target: "config" | "tunnel"; method: string; args: any[] }
  | { type: workerMessageType.Response; id: string; result?: any; error?: string }
  | { type: workerMessageType.Callback; event: string; data: any }
  | { type: workerMessageType.RegisterCallback; event: string }
  | { type: workerMessageType.enableLogger; enabled: boolean };
