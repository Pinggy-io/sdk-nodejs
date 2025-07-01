export interface HeaderModification {
  key: string;
  value?: string;
  action: "add" | "remove" | "update";
}

export interface PinggyOptions {
  token?: string;
  serverAddress?: string;
  sniServerName?: string;
  forwardTo?: string;
  debug?: boolean;
  debuggerPort?: number;
  type?: "tcp" | "tls" | "http" | "udp";
  ipWhitelist?: string[];
  basicAuth?: Record<string, string>;
  bearerAuth?: string[];
  headerModification?: HeaderModification[]; // Updated to use structured format
  xff?: boolean;
  httpsOnly?: boolean;
  fullRequestUrl?: boolean;
  allowPreflight?: boolean;
  noReverseProxy?: boolean;
  cmd?: string; // optional command prefix
  ssl?: boolean; // whether to use SSL connection for tunnel setup
}

export interface PinggyNative {
  createConfig(): number;
  configSetArgument: (configRef: number, arg: string) => void;
  configSetToken(configRef: number, token: string): void;
  configSetServerAddress(configRef: number, address: string): void;
  configSetSniServerName(configRef: number, name: string): void;
  configSetTcpForwardTo(configRef: number, address: string): void;
  configSetUdpForwardTo(configRef: number, address: string): void;
  configSetType(configRef: number, type: string): void;
  configSetUdpType(configRef: number, type: string): void;
  configSetSsl(configRef: number, ssl: boolean): void;
  configGetToken(configRef: number): string;
  configGetServerAddress(configRef: number): string;
  configGetSniServerName(configRef: number): string;
  setLogPath(path: string): void;
  setLogEnable(enable: boolean): void;
  tunnelInitiate(configRef: number): number;
  tunnelConnect(tunnelRef: number): boolean;
  tunnelResume(tunnelRef: number): boolean;
  tunnelStartWebDebugging(tunnelRef: number, port: number): void;
  tunnelRequestPrimaryForwarding(tunnelRef: number): void;
  tunnelRequestAdditionalForwarding(
    tunnelRef: number,
    remoteAddress: string,
    localAddress: string
  ): void;
  tunnelSetAuthenticatedCallback(tunnelRef: number, callback: () => void): void;
  tunnelSetPrimaryForwardingSucceededCallback(
    tunnelRef: number,
    callback: (addresses: string[]) => void
  ): void;
  tunnelSetPrimaryForwardingFailedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, errorMessage: string) => void
  ): void;
  tunnelSetAdditionalForwardingSucceededCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      bindAddr: string,
      forwardToAddr: string,
      protocol: string
    ) => void
  ): void;
  tunnelSetAdditionalForwardingFailedCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      remoteAddress: string,
      errorMessage: string
    ) => void
  ): void;
  tunnelStop(tunnelRef: number): boolean;
  tunnelIsActive(tunnelRef: number): boolean;
  initExceptionHandling(): void;
  getLastException(): string;
  tunnelSetAuthenticationFailedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, errorMessage: string) => void
  ): void;
  tunnelSetOnTunnelErrorCallback(
    tunnelRef: number,
    callback: (
      tunnelRef: number,
      errorNo: number,
      error: string,
      recoverable: boolean
    ) => void
  ): void;
  tunnelSetOnDisconnectedCallback(
    tunnelRef: number,
    callback: (tunnelRef: number, error: string, messages: string[]) => void
  ): void;
  setDebugLogging(enabled: boolean): void;
}

export interface Config {
  configRef: number;
  setToken(token: string): void;
  setServerAddress(address?: string): void;
  getServerAddress(): string | null;
  getSniServerName(): string | null;
  getToken(): string | null;
}

export interface Tunnel {
  tunnelRef: number;
  authenticated: boolean;
  primaryForwardingDone: boolean;
  start(): void;
  startWebDebugging(listeningPort: number): void;
  tunnelRequestAdditionalForwarding(
    remoteAddress: string,
    localAddress: string
  ): void;
  tunnelStop(): boolean;
  tunnelIsActive(): boolean;
}
