import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

// Mock the native addon to prevent loading issues during testing
jest.mock("@mapbox/node-pre-gyp", () => ({
  find: jest.fn(() => "mocked-path"),
}));

// Mock the native module with all required functions
const mockAddon = {
  // Pinggy management
  setDebugLogging: jest.fn(),
  setLogPath: jest.fn(),
  setLogEnable: jest.fn(),
  initExceptionHandling: jest.fn(),
  getLastException: jest.fn(() => ""),
  getPinggyVersion: jest.fn(() => "MOCK_VERSION"),

  // Config setters
  createConfig: jest.fn(() => 1),
  configSetArgument: jest.fn(),
  configSetToken: jest.fn(),
  configSetServerAddress: jest.fn(),
  configSetSniServerName: jest.fn(),
  configSetTcpForwardTo: jest.fn(),
  configSetUdpForwardTo: jest.fn(),
  configSetType: jest.fn(),
  configSetUdpType: jest.fn(),
  configSetSsl: jest.fn(),
  configSetAutoReconnect: jest.fn(),
  configSetForce: jest.fn(),

  // Config getters
  configGetArgument: jest.fn(() => "MOCK_ARG"),
  configGetToken: jest.fn(() => "mock-token"),
  configGetServerAddress: jest.fn(() => "mock-server"),
  configGetSniServerName: jest.fn(() => "mock-sni"),
  configGetSsl: jest.fn(() => true),
  configGetAutoReconnect: jest.fn(() => false),
  configGetForce: jest.fn(() => false),

  // Tunnel management
  tunnelInitiate: jest.fn(() => 1),
  tunnelConnect: jest.fn(() => true),
  tunnelResume: jest.fn(() => true),
  tunnelStop: jest.fn(() => true),
  tunnelIsActive: jest.fn(() => false),

  // Tunnel actions
  tunnelStartWebDebugging: jest.fn(),
  tunnelRequestPrimaryForwarding: jest.fn(),
  tunnelRequestAdditionalForwarding: jest.fn(),
  tunnelStartUsageUpdate: jest.fn(),
  tunnelStopUsageUpdate: jest.fn(),

  // Tunnel callbacks
  tunnelSetAuthenticatedCallback: jest.fn(),
  tunnelSetAuthenticationFailedCallback: jest.fn(),
  tunnelSetPrimaryForwardingSucceededCallback: jest.fn(),
  tunnelSetPrimaryForwardingFailedCallback: jest.fn(),
  tunnelSetAdditionalForwardingSucceededCallback: jest.fn(),
  tunnelSetAdditionalForwardingFailedCallback: jest.fn(),
  tunnelSetOnDisconnectedCallback: jest.fn(),
  tunnelSetOnWillReconnectCallback: jest.fn(),
  tunnelSetOnTunnelErrorCallback: jest.fn(),
  tunnelSetOnUsageUpdateCallback: jest.fn(),
};

jest.mock("mocked-path", () => mockAddon, { virtual: true });

import { Pinggy } from "../pinggy";

describe("Debug Logging", () => {
  let originalEnv: string | undefined;
  const pinggy = Pinggy.instance;

  beforeEach(() => {
    // Store original environment variable
    originalEnv = process.env.PINGGY_DEBUG;
    // Reset the mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.PINGGY_DEBUG = originalEnv;
    } else {
      delete process.env.PINGGY_DEBUG;
    }

    // Reset debug logging to default state
    pinggy.setDebugLogging(false);
  });

  describe("JavaScript API Control", () => {
    it("should call native setDebugLogging when enabling debug logging", () => {
      pinggy.setDebugLogging(true);
      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(true);
    });

    it("should call native setDebugLogging when disabling debug logging", () => {
      pinggy.setDebugLogging(false);
      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(false);
    });

    it("should handle boolean values correctly", () => {
      pinggy.setDebugLogging(true);
      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(true);

      pinggy.setDebugLogging(false);
      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(false);

      expect(mockAddon.setDebugLogging).toHaveBeenCalledTimes(2);
    });

    it("should not throw when calling setDebugLogging", () => {
      expect(() => {
        pinggy.setDebugLogging(true);
        pinggy.setDebugLogging(false);
      }).not.toThrow();
    });
  });

  describe("Integration with Core Functions", () => {
    it("should not interfere with tunnel creation when debug is enabled", () => {
      pinggy.setDebugLogging(true);

      expect(() => {
        pinggy.createTunnel({
          type: "http",
          forwardTo: "localhost:3000",
        });
      }).not.toThrow();

      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(true);
    });

    it("should not interfere with tunnel creation when debug is disabled", () => {
      pinggy.setDebugLogging(false);

      expect(() => {
        pinggy.createTunnel({
          type: "http",
          forwardTo: "localhost:3000",
        });
      }).not.toThrow();

      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(false);
    });

    it("should allow multiple debug state changes", () => {
      expect(() => {
        pinggy.setDebugLogging(true);
        pinggy.setDebugLogging(false);
        pinggy.setDebugLogging(true);
        pinggy.setDebugLogging(false);
      }).not.toThrow();

      expect(mockAddon.setDebugLogging).toHaveBeenCalledTimes(4);
    });
  });

  describe("Error Handling", () => {
    it("should handle type coercion for setDebugLogging", () => {
      expect(() => {
        // These should be handled by TypeScript/JavaScript type coercion
        pinggy.setDebugLogging(true);
        pinggy.setDebugLogging(false);
        pinggy.setDebugLogging(!!1);
        pinggy.setDebugLogging(!!0);
      }).not.toThrow();

      expect(mockAddon.setDebugLogging).toHaveBeenCalledTimes(4);
    });
  });
});
