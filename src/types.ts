export interface PinggyOptions {
  token?: string;
  serverAddress?: string;
  sniServerName?: string;
  forwardTo?: string;
  debug?: boolean;
  debuggerPort?: number;
}

export interface PinggyNative {
  createConfig(): number;
  configSetToken(configRef: number, token: string): void;
  configSetServerAddress(configRef: number, address: string): void;
  configSetSniServerName(configRef: number, name: string): void;
  configSetTcpForwardTo(configRef: number, address: string): void;
  configGetToken(configRef: number): string;
  configGetServerAddress(configRef: number): string;
  configGetSniServerName(configRef: number): string;
  setLogPath(path: string): void;
  tunnelInitiate(configRef: number): number;
  tunnelConnect(tunnelRef: number): boolean;
  tunnelResume(tunnelRef: number): number;
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
  tunnelStop(tunnelRef: number): boolean;
  tunnelIsActive(tunnelRef: number): boolean;
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
