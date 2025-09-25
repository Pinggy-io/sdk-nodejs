import { PinggyError } from "./bindings/exception";

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
  value?: string[];

  /**
   * The action to perform: add, remove, or update.
   */
  type: "add" | "remove" | "update";
}

export interface ForwardingEntry {
  listenAddress?: string; // empty or undefined means default forwarding
  address: string;        // e.g., http://localhost:80 or https://localhost:5555 or host:port
}

/**
 * Advanced SSL and additional options for Pinggy tunnels.
 * 
 * @group Interfaces
 * @public
 */

export interface Optional {
  /**
   * SNI server name for SSL/TLS.
   * @example "example.com"
   */
  sniServerName?: string;
  /**
   * Whether to use SSL for tunnel setup.
   * @default false
   */
  ssl?: boolean;
  /**
   * Optional command prefix for the tunnel.
   * @example "--tcp"
   */
  additionalArguments?: string;
}

export const enum TunnelType {
  Http = "http",
  Tcp = "tcp",
  Tls = "tls",
  Udp = "udp",
  TlsTcp = "tlstcp",
}
/**
 * Configuration options for creating Pinggy tunnels.
 *
 * @group Types
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
export type PinggyOptionsType = {
  /**
 * Server address to connect to.
 * @example "connect.pinggy.io"
 */
  serverAddress?: string;
  /**
   * Authentication token for the tunnel.
   * @example "tk_123abc456def"
   */
  token?: string;
  /**
   * Forwarding can either be a string, or a list of objects. But it is required - at least empty string or empty list.
   * @example "http://localhost:3000" or [{ address: "http://localhost:3000" }, { listenAddress: "0.tcp.pinggy.io:12345", address: "http://localhost:4000" }]
   */
  forwarding?: string | ForwardingEntry[];
  /**
   * Local address for web debugger.
   * @example "localhost:8080"
   */
  webDebugger?: string;
  /**
   * Tunnel protocol types.
   * (Required) One or more of: "http", "tcp", "tls", "udp", "tlstcp"
   */
  tunnelType?: TunnelType[];
  /**
   * List of whitelisted IP addresses that can access the tunnel.
   * @example ["192.168.1.1", "10.0.0.1"]
   */
  ipWhitelist?: string[];
  /**
   * Basic authentication credentials (username: password).
   * @example { "admin": "secret123", "user": "password" }
   */
  basicAuth?: { username: string; password: string }[];
  /**
   * List of bearer authentication tokens.
   * @example ["token123", "token456"]
   */
  bearerTokenAuth?: string[];
  /**
   * List of header modification rules.
   * @see {@link HeaderModification}
   */
  headerModification?: HeaderModification[];
  /**
   * Enable X-Forwarded-For header to pass client IP information.
   * @default false
   */
  xForwardedFor?: boolean;
  /**
   * Only allow HTTPS connections to the tunnel.
   * @default false
   */
  httpsOnly?: boolean;
  /**
   * Forward the full request URL to the backend service.
   * @default false
   */
  originalRequestUrl?: boolean;
  /**
   * Allow CORS preflight (OPTIONS) requests.
   * @default false
   */
  allowPreflight?: boolean;
  /**
   * Disable reverse proxy behavior.
   * @default false
   */
  reverseProxy?: boolean;
  /**
   * Advanced SSL and additional configuration options.
   * @see {@link Optional}
   */
  optional?: Optional;
  /**
   * Force specific tunnel settings or bypass certain restrictions.
   * @default false
   */
  force?: boolean;
  /**
   * Auto-reconnect configuration for the tunnel.
   * @default false
   */
  autoReconnect?: boolean;
  /** Time interval (in seconds) between reconnection attempts.
   * @default 5
   */
  reconnectInterval?: number;
  /** Maximum number of reconnection attempts before giving up.
   * @default 20
   */
  maxReconnectAttempts?: number;
};

export class PinggyOptions implements PinggyOptionsType {
  public forwarding?: string | ForwardingEntry[];
  public token?: string;
  public serverAddress?: string;
  public webDebugger?: string;
  public tunnelType?: TunnelType[];
  public ipWhitelist?: string[];
  public basicAuth?: { username: string; password: string }[];
  public bearerTokenAuth?: string[];
  public headerModification?: HeaderModification[];
  public xForwardedFor?: boolean;
  public httpsOnly?: boolean;
  public localServerTls?: string;
  public originalRequestUrl?: boolean;
  public allowPreflight?: boolean;
  public reverseProxy?: boolean;
  public optional?: Optional;
  public force?: boolean;
  public autoReconnect?: boolean;
  public reconnectInterval?: number;
  public maxReconnectAttempts?: number;

  private hostPortRegex = /^[a-zA-Z0-9.-]+:\d+$/;
  // IPv4
  private ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  // IPv4 with CIDR (/0 - /32)
  private ipv4CidrRegex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\/(?:[0-9]|[1-2]\d|3[0-2])$/;
  // IPv6
  private ipv6Regex = /^((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/;
  // IPv6 with CIDR (/0 - /128)
  private ipv6CidrRegex = /^((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)\/(?:[0-9]|[1-9]\d|1[01]\d|12[0-8])$/;


  constructor(options: PinggyOptionsType = {}) {
    this.forwarding = options.forwarding;
    this.token = options.token;
    this.serverAddress = options.serverAddress;
    this.webDebugger = options.webDebugger;
    this.tunnelType = options.tunnelType;
    this.ipWhitelist = options.ipWhitelist;
    this.basicAuth = options.basicAuth;
    this.bearerTokenAuth = options.bearerTokenAuth;
    this.headerModification = options.headerModification;
    this.xForwardedFor = options.xForwardedFor;
    this.httpsOnly = options.httpsOnly;
    this.originalRequestUrl = options.originalRequestUrl;
    this.allowPreflight = options.allowPreflight;
    this.reverseProxy = options.reverseProxy;
    this.optional = options.optional;
    this.force = options.force;
    this.autoReconnect = options.autoReconnect;
    this.reconnectInterval = options.reconnectInterval;
    this.maxReconnectAttempts = options.maxReconnectAttempts;
  }

  /**
   * Get SSL configuration.
   * @returns SSL setting from advanced options
   */
  getSsl(): boolean | undefined {
    return this.optional?.ssl;
  }

  /**
   * Get SNI server name configuration.
   * @returns SNI server name from advanced options
   */
  getSniServerName(): string | undefined {
    return this.optional?.sniServerName;
  }

  /**
   * Get additional arguments configuration.
   * @returns Additional arguments from advanced options
   */
  getAdditionalArguments(): string | undefined {
    return this.optional?.additionalArguments;
  }

  /**
   * Get all advanced options.
   * @returns The complete advanced options object
   */
  getOptions(): Optional | undefined {
    return this.optional;
  }

  /**
   * Get Local Server TLS configuration.
   * @returns Local Server TLS hostname
   */
  getLocalServerTls(): string | undefined {
    // Try to infer from the primary forwarding address
    const primaryAddress = this.getForwardingPrimary();
    if (primaryAddress) {
      try {
        const maybeUrl = new URL(primaryAddress);
        const proto = maybeUrl.protocol.toLowerCase();
        if (proto === "https:") {
          return PinggyOptions.getHostnameFromUrl(maybeUrl);
        }
      } catch {
        // Not a URL, cannot infer TLS info
      }
    }
    return undefined;
  }

  private static getHostnameFromUrl(u: URL): string | undefined {
    return u.hostname || undefined;
  }

  getForwardingPrimary(): string | undefined {
    const f = this.forwarding;
    if (!f) return undefined;
    if (typeof f === "string") return f;
    if (Array.isArray(f) && f.length > 0) {
      const primary = f.find((e: ForwardingEntry) => !e.listenAddress || e.listenAddress.trim() === "");
      return (primary ?? f[0]).address;
    }
    return undefined;
  }

  getAdditionalForwarding(): ForwardingEntry[] {
    const f = this.forwarding;
    if (!f) return [];
    if (typeof f === "string") return [];
    const primary = f.find((e: ForwardingEntry) => !e.listenAddress || e.listenAddress.trim() === "");
    return f.filter((e: ForwardingEntry) => e !== primary);
  }

  /**
   * Validates the current configuration and throws errors if any issues are found.
   * @throws {Error} When validation fails
   */
  validate(): void {
    const errors: string[] = [];

    // Validate forwarding
    if (!this.forwarding) {
      errors.push("Forwarding configuration is required");
    } else if (typeof this.forwarding === "string") {
      if (this.forwarding.trim() === "") {
        errors.push("Forwarding string cannot be empty");
      } else {
        this.validateForwardingAddress(this.forwarding, errors);
      }
    } else if (Array.isArray(this.forwarding)) {
      if (this.forwarding.length === 0) {
        errors.push("Forwarding array cannot be empty");
      } else {
        this.forwarding.forEach((entry, index) => {
          if (!entry.address || entry.address.trim() === "") {
            errors.push(`Forwarding entry at index ${index} must have a valid address`);
          } else {
            this.validateForwardingAddress(entry.address, errors, `entry ${index}`);
          }
        });
      }
    }

    // Validate tunnel types
    if (this.tunnelType && this.tunnelType.length === 0) {
      errors.push("Tunnel types array cannot be empty if specified");
    }

    // Validate IP whitelist
    if (this.ipWhitelist && this.ipWhitelist.length > 0) {
      this.ipWhitelist.forEach((ip, index) => {
        if (!this.isValidIPorCIDR(ip)) {
          errors.push(`Invalid IP address at index ${index}: ${ip}`);
        }
      });
    }

    // Validate basic auth
    if (this.basicAuth && this.basicAuth.length > 0) {
      this.basicAuth.forEach((auth, index) => {
        if (!auth.username || auth.username.trim() === "") {
          errors.push(`Basic auth entry at index ${index} must have a username`);
        }
        if (!auth.password || auth.password.trim() === "") {
          errors.push(`Basic auth entry at index ${index} must have a password`);
        }
      });
    }

    // Validate bearer tokens
    if (this.bearerTokenAuth && this.bearerTokenAuth.length > 0) {
      this.bearerTokenAuth.forEach((token, index) => {
        if (!token || token.trim() === "") {
          errors.push(`Bearer token at index ${index} cannot be empty`);
        }
      });
    }

    // Validate header modifications
    if (this.headerModification && this.headerModification.length > 0) {
      this.headerModification.forEach((header, index) => {
        if (!header.key || header.key.trim() === "") {
          errors.push(`Header modification at index ${index} must have a key`);
        }
        if ((header.type === "add" || header.type === "update") && (!header.value || header.value.length === 0)) {
          errors.push(`Header modification at index ${index} with type '${header.type}' must have a value`);
        }
      });
    }

    // Validate reconnection settings
    if (this.autoReconnect) {
      if (this.reconnectInterval !== undefined && this.reconnectInterval <= 0) {
        errors.push("Reconnect interval must be greater than 0");
      }
      if (this.maxReconnectAttempts !== undefined && this.maxReconnectAttempts <= 0) {
        errors.push("Max reconnect attempts must be greater than 0");
      }
    }

    // Validate web debugger address
    if (this.webDebugger && !this.isValidAddress(this.webDebugger)) {
      errors.push(`Invalid web debugger address: ${this.webDebugger}`);
    }

    // Validate server address
    if (this.serverAddress && !this.isValidAddress(this.serverAddress)) {
      errors.push(`Invalid server address: ${this.serverAddress}`);
    }

    // Validate token format (basic check)
    if (this.token && (this.token.trim() === "" || this.token.length < 10)) {
      errors.push("Token must be at least 10 characters long");
    }

    if (errors.length > 0) {
      throw new PinggyError(`Validation failed:\n${errors.map(err => `- ${err}`).join('\n')}`);
    }
  }

  private validateForwardingAddress(address: string, errors: string[], context: string = "forwarding address"): void {
    try {
      // Check if any configured tunnel type is HTTP
      if (this.tunnelType?.includes(TunnelType.Http)) {
        let url: URL;

        // Allow host:port without protocol, assume http://
        if (this.hostPortRegex.test(address)) {
          url = new URL(`http://${address}`);
        } else {
          url = new URL(address);
        }

        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push(
            `Invalid protocol in ${context}: ${url.protocol}. Must be http: or https:`
          );
        }

      } else {
        // For tcp, udp, tls, tlstcp → only host:port

        if (!this.hostPortRegex.test(address)) {
          errors.push(
            `Invalid ${context} for non-http tunnel types: ${address}. Must be host:port`
          );
        }
      }
    } catch {
      errors.push(`Invalid ${context}: ${address}`);
    }
  }

  private isValidIPorCIDR(ip: string): boolean {

    return (
      this.ipv4Regex.test(ip) ||
      this.ipv4CidrRegex.test(ip) ||
      this.ipv6Regex.test(ip) ||
      this.ipv6CidrRegex.test(ip)
    );
  }


  private isValidAddress(address: string): boolean {
    try {
      new URL(`http://${address}`);
      return true;
    } catch {
      // Check if it's a valid host:port format
      return this.hostPortRegex.test(address);
    }
  }
}
