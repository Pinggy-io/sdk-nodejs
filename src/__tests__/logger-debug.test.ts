import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import fs from "fs";

// Mock fs to prevent actual file operations during testing
jest.mock("fs");
const mockFs = fs as jest.Mocked<typeof fs>;

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

import { Logger } from "../utils/logger";
import { Pinggy } from "../pinggy";

describe("Logger Debug Control", () => {
  let consoleInfoSpy: any;
  let consoleErrorSpy: any;
  const pinggy = Pinggy.instance;

  beforeEach(() => {
    // Mock console methods
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock fs methods
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => "");
    (mockFs.appendFile as any).mockImplementation(
      (path: any, data: any, callback: any) => {
        if (typeof callback === "function") {
          callback(null);
        }
      }
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Reset debug logging state
    pinggy.setDebugLogging(false);
  });

  describe("Info Logging with Debug Control", () => {
    it("should NOT log info messages when debug logging is disabled", () => {
      // Set debug logging to false
      pinggy.setDebugLogging(false);

      // Try to log an info message
      Logger.info("This should not appear");

      // Verify that console.info was NOT called
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      // Verify that file logging was NOT attempted
      expect(mockFs.appendFile).not.toHaveBeenCalled();
    });

    it("should log info messages when debug logging is enabled", () => {
      // Set debug logging to true
      pinggy.setDebugLogging(true);

      // Log an info message
      Logger.info("This should appear");

      // Verify that console.info was called
      expect(consoleInfoSpy).toHaveBeenCalled();

      // Verify that file logging was attempted
      expect(mockFs.appendFile).toHaveBeenCalled();
    });

    it("should respect debug state changes at runtime", () => {
      // Start with debug disabled
      pinggy.setDebugLogging(false);
      Logger.info("Message 1 - should not appear");
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      // Enable debug logging
      pinggy.setDebugLogging(true);
      Logger.info("Message 2 - should appear");
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

      // Disable debug logging again
      pinggy.setDebugLogging(false);
      Logger.info("Message 3 - should not appear");
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1); // Still just 1 call
    });
  });

  describe("Error Logging (Always Enabled)", () => {
    it("should ALWAYS log error messages regardless of debug state - when disabled", () => {
      // Set debug logging to false
      pinggy.setDebugLogging(false);

      // Log an error message
      const testError = new Error("Test error");
      Logger.error("This error should always appear", testError);

      // Verify that console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify that file logging was attempted
      expect(mockFs.appendFile).toHaveBeenCalled();
    });

    it("should ALWAYS log error messages regardless of debug state - when enabled", () => {
      // Set debug logging to true
      pinggy.setDebugLogging(true);

      // Log an error message
      const testError = new Error("Test error");
      Logger.error("This error should always appear", testError);

      // Verify that console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify that file logging was attempted
      expect(mockFs.appendFile).toHaveBeenCalled();
    });

    it("should log errors without Error object", () => {
      // Test with debug disabled
      pinggy.setDebugLogging(false);
      Logger.error("Error message without error object");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockFs.appendFile).toHaveBeenCalled();
    });
  });

  describe("Mixed Logging Scenarios", () => {
    it("should handle mixed info and error logging correctly", () => {
      // Debug disabled
      pinggy.setDebugLogging(false);

      Logger.info("Info message - should not appear");
      Logger.error("Error message - should appear");
      Logger.info("Another info - should not appear");

      // Only error should have been logged
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(mockFs.appendFile).toHaveBeenCalledTimes(1);
    });

    it("should handle debug state changes with mixed logging", () => {
      // Start disabled
      pinggy.setDebugLogging(false);
      Logger.info("Info 1 - no");
      Logger.error("Error 1 - yes");

      // Enable debug
      pinggy.setDebugLogging(true);
      Logger.info("Info 2 - yes");
      Logger.error("Error 2 - yes");

      // Disable again
      pinggy.setDebugLogging(false);
      Logger.info("Info 3 - no");
      Logger.error("Error 3 - yes");

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1); // Only "Info 2"
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3); // All errors
    });
  });

  describe("Integration with Pinggy Debug System", () => {
    it("should sync with native debug logging state", () => {
      // Enable debug logging
      pinggy.setDebugLogging(true);

      // Verify native addon was called
      expect(mockAddon.setDebugLogging).toHaveBeenCalledWith(true);

      // Verify Logger respects the state
      Logger.info("Test message");
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should work with default debug state (disabled)", () => {
      // Don't explicitly set debug state (should default to disabled)
      Logger.info("Default state message");

      // Should not log info by default
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      // But errors should still work
      Logger.error("Default state error");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
