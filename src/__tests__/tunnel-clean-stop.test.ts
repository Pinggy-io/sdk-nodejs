import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

// Mock the native addon
jest.mock("@mapbox/node-pre-gyp", () => ({
  find: jest.fn(() => "mocked-path"),
}));

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

// Mock fs for Logger
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  appendFile: jest.fn((path, data, callback) => {
    if (typeof callback === "function") callback(null);
  }),
}));

import { Tunnel } from "../bindings/tunnel";

describe("Tunnel Clean Stop", () => {
  let tunnel: Tunnel;
  let consoleErrorSpy: any;
  let consoleInfoSpy: any;

  beforeEach(() => {
    // Mock console methods to capture logs
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();

    // Create tunnel instance
    tunnel = new Tunnel(mockAddon as any, 1);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe("Clean Stop Behavior", () => {
    it("should not log errors after clean tunnel stop", async () => {
      // Setup: Mock successful tunnel operations
      mockAddon.tunnelConnect.mockReturnValue(true);
      mockAddon.tunnelResume.mockReturnValue(true);
      mockAddon.tunnelStop.mockReturnValue(true);

      // Simulate the scenario: tunnel is stopped intentionally
      const stopResult = tunnel.tunnelStop();

      // Verify stop was successful
      expect(stopResult).toBe(true);
      expect(mockAddon.tunnelStop).toHaveBeenCalledWith(1);

      // Now simulate what happens when polling continues after stop
      // This should NOT log an error since the tunnel was stopped intentionally
      mockAddon.tunnelResume.mockReturnValue(false); // This would normally cause an error

      // Wait a bit to see if any errors are logged from polling
      await new Promise((resolve) => setTimeout(resolve, 50));

      // The key test: no error should be logged after clean stop
      const errorCalls = consoleErrorSpy.mock.calls.filter(
        (call: any[]) =>
          call[0].includes("Tunnel error detected") ||
          call[0].includes("Error during tunnel polling")
      );

      expect(errorCalls).toHaveLength(0);
    });

    it("should stop polling after tunnel is stopped", async () => {
      // Setup: Start with working tunnel
      mockAddon.tunnelConnect.mockReturnValue(true);
      mockAddon.tunnelResume.mockReturnValue(true);
      mockAddon.tunnelStop.mockReturnValue(true);

      // Stop the tunnel
      tunnel.tunnelStop();

      // Reset the mock call count
      jest.clearAllMocks();

      // Wait to see if polling continues
      await new Promise((resolve) => setTimeout(resolve, 100));

      // tunnelResume should not be called after stop
      expect(mockAddon.tunnelResume).not.toHaveBeenCalled();
    });

    it("should handle graceful stop during active polling", async () => {
      // Setup: Tunnel is actively polling
      mockAddon.tunnelConnect.mockReturnValue(true);
      mockAddon.tunnelResume.mockReturnValue(true);
      mockAddon.tunnelStop.mockReturnValue(true);

      // Let polling start
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Stop the tunnel while polling is active
      const stopResult = tunnel.tunnelStop();
      expect(stopResult).toBe(true);

      // Wait to ensure no errors are logged
      await new Promise((resolve) => setTimeout(resolve, 50));

      // No polling errors should be logged
      const errorCalls = consoleErrorSpy.mock.calls.filter((call: any[]) =>
        call[0].includes("Tunnel error detected")
      );
      expect(errorCalls).toHaveLength(0);
    });

    it("should set tunnel status to closed after stop", () => {
      mockAddon.tunnelStop.mockReturnValue(true);

      // Initial status should not be closed
      expect(tunnel.status).not.toBe("closed");

      // Stop the tunnel
      tunnel.tunnelStop();

      // Status should be closed after stop
      expect(tunnel.status).toBe("closed");
    });

    it("should still log errors for genuine tunnel failures", async () => {
      // Setup: Tunnel is running normally initially
      mockAddon.tunnelConnect.mockReturnValue(true);
      mockAddon.tunnelResume.mockReturnValueOnce(true); // First call succeeds
      mockAddon.tunnelResume.mockReturnValue(false); // Subsequent calls fail

      // Start the tunnel and let polling begin
      tunnel.start().catch(() => {}); // Ignore start errors for this test

      // Wait a bit for polling to start and detect the error
      await new Promise((resolve) => setTimeout(resolve, 100));

      // This should log an error since it's a genuine failure (not intentional stop)
      const errorCalls = consoleErrorSpy.mock.calls.filter((call: any[]) =>
        call[0].includes("Tunnel error detected")
      );
      expect(errorCalls.length).toBeGreaterThan(0);
    });
  });

  describe("Integration with TunnelInstance", () => {
    it("should not cause errors when TunnelInstance.stop() is called", () => {
      mockAddon.tunnelStop.mockReturnValue(true);

      // This simulates TunnelInstance.stop() calling tunnel.tunnelStop()
      const result = tunnel.tunnelStop();

      expect(result).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Tunnel error detected")
      );
    });
  });

  describe("Tunnel Callbacks", () => {
    it("should register all callbacks on start", async () => {
      await tunnel.start();

      expect(mockAddon.tunnelSetAuthenticatedCallback).toHaveBeenCalled();
      expect(mockAddon.tunnelSetAuthenticationFailedCallback).toHaveBeenCalled();
      expect(
        mockAddon.tunnelSetPrimaryForwardingSucceededCallback
      ).toHaveBeenCalled();
      expect(
        mockAddon.tunnelSetPrimaryForwardingFailedCallback
      ).toHaveBeenCalled();
      expect(
        mockAddon.tunnelSetAdditionalForwardingSucceededCallback
      ).toHaveBeenCalled();
      expect(
        mockAddon.tunnelSetAdditionalForwardingFailedCallback
      ).toHaveBeenCalled();
      expect(mockAddon.tunnelSetOnDisconnectedCallback).toHaveBeenCalled();
      expect(mockAddon.tunnelSetOnWillReconnectCallback).toHaveBeenCalled();
      expect(mockAddon.tunnelSetOnTunnelErrorCallback).toHaveBeenCalled();
      expect(mockAddon.tunnelSetOnUsageUpdateCallback).toHaveBeenCalled();
    });
  });
});
