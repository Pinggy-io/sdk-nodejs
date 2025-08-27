import { describe, beforeEach, test, expect } from "@jest/globals";
import { Config } from "../bindings/config";

describe("Config.prepareAndSetArgument", () => {
  let mockAddon: any;
  let setArgumentValue: string | null;
  let config: Config;

  beforeEach(() => {
    setArgumentValue = null;
    mockAddon = {
      // Pinggy management
      setDebugLogging: jest.fn(),
      setLogPath: jest.fn(),
      setLogEnable: jest.fn(),
      initExceptionHandling: jest.fn(),
      getLastException: jest.fn(() => null),
      getPinggyVersion: jest.fn(() => "MOCK_VERSION"),

      // Config setters
      createConfig: jest.fn(() => 1),
      configSetArgument: jest.fn((ref: number, arg: string) => {
        setArgumentValue = arg;
      }),
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

      // Tunnel management and actions
      tunnelInitiate: jest.fn(() => 1),
      tunnelConnect: jest.fn(() => true),
      tunnelResume: jest.fn(() => true),
      tunnelStop: jest.fn(() => true),
      tunnelIsActive: jest.fn(() => false),
      tunnelStartWebDebugging: jest.fn(),
      tunnelRequestPrimaryForwarding: jest.fn(),
      tunnelRequestAdditionalForwarding: jest.fn(),
      tunnelStartUsageUpdate: jest.fn(),
      tunnelStopUsageUpdate: jest.fn(),

      // All tunnel callbacks
      tunnelSetAuthenticatedCallback: jest.fn(),
      tunnelSetAuthenticationFailedCallback: jest.fn(),
      tunnelSetPrimaryForwardingSucceededCallback: jest.fn(),
      tunnelSetPrimaryForwardingFailedCallback: jest.fn(),
      tunnelSetAdditionalForwardingSucceededCallback: jest.fn(),
      tunnelSetAdditionalForwardingFailedCallback: jest.fn(),
      tunnelSetOnDisconnectedCallback: jest.fn(),
      tunnelSetOnWillReconnectCallback: jest.fn(),
      tunnelSetOnReconnectingCallback: jest.fn(),
      tunnelSetOnReconnectionCompletedCallback: jest.fn(),
      tunnelSetOnReconnectionFailedCallback: jest.fn(),
      tunnelSetOnTunnelErrorCallback: jest.fn(),
      tunnelSetOnUsageUpdateCallback: jest.fn(),
    };

    // Create a minimal config instance for testing
    config = new Config(mockAddon, {});
    setArgumentValue = null; // Reset after constructor
  });

  function testPrepareAndSetArgument(options: any) {
    config.prepareAndSetArgument(1, options);
    return setArgumentValue;
  }

  test("ipWhitelist", () => {
    const result = testPrepareAndSetArgument({
      ipWhitelist: ["1.2.3.4", "5.6.7.8"],
    });
    expect(result).toContain("w:1.2.3.4,5.6.7.8");
  });

  test("basicAuth", () => {
    const result = testPrepareAndSetArgument({
      basicAuth: { user1: "pass1", user2: "pass_two" },
    });
    console.log("Basic Auth Result:", result);
    expect(result).toContain("b:user1:pass1");
    expect(result).toContain("b:user2:pass_two");
  });

  test("bearerAuth", () => {
    const result = testPrepareAndSetArgument({
      bearerAuth: ["token1", "token2"],
    });
    expect(result).toContain("k:token1");
    expect(result).toContain("k:token2");
  });

  test("headerModification add", () => {
    const result = testPrepareAndSetArgument({
      headerModification: [{ action: "add", key: "X-Test", value: "abc" }],
    });
    expect(result).toContain("a:X-Test:abc");
  });

  test("headerModification remove", () => {
    const result = testPrepareAndSetArgument({
      headerModification: [{ action: "remove", key: "X-Remove" }],
    });
    expect(result).toContain("r:X-Remove");
  });

  test("headerModification update", () => {
    const result = testPrepareAndSetArgument({
      headerModification: [{ action: "update", key: "X-Up", value: "val" }],
    });
    expect(result).toContain("u:X-Up:val");
  });

  test("xff", () => {
    const result = testPrepareAndSetArgument({ xff: true });
    expect(result).toContain("x:xff");
  });

  test("httpsOnly", () => {
    const result = testPrepareAndSetArgument({ httpsOnly: true });
    expect(result).toContain("x:https");
  });

  test("fullRequestUrl", () => {
    const result = testPrepareAndSetArgument({ fullRequestUrl: true });
    expect(result).toContain("x:fullurl");
  });

  test("allowPreflight", () => {
    const result = testPrepareAndSetArgument({ allowPreflight: true });
    expect(result).toContain("x:passpreflight");
  });

  test("noReverseProxy", () => {
    const result = testPrepareAndSetArgument({ noReverseProxy: true });
    expect(result).toContain("x:noreverseproxy");
  });

  test("cmd prepends argument", () => {
    const result = testPrepareAndSetArgument({ cmd: "echo test", xff: true });
    expect(result?.startsWith("echo test ")).toBe(true);
    expect(result).toContain("x:xff");
  });

  test("configSetArgument is called with correct parameters", () => {
    const spy = jest.spyOn(mockAddon, "configSetArgument");
    spy.mockClear(); // Clear any previous calls
    const configRef = 42;
    const options = { xff: true, httpsOnly: true };

    config.prepareAndSetArgument(configRef, options);

    // Check that it was called once with the correct configRef and a string containing both options
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      configRef,
      expect.stringMatching(/.*x:xff.*x:https.*|.*x:https.*x:xff.*/)
    );

    spy.mockRestore();
  });

  test("configSetArgument handles empty options", () => {
    const spy = jest.spyOn(mockAddon, "configSetArgument");
    spy.mockClear(); // Clear any previous calls
    const configRef = 1;

    config.prepareAndSetArgument(configRef, {});

    expect(spy).toHaveBeenCalledWith(configRef, "");
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  test("configSetArgument with complex options", () => {
    const spy = jest.spyOn(mockAddon, "configSetArgument");
    spy.mockClear(); // Clear any previous calls
    const configRef = 99;
    const complexOptions = {
      cmd: "custom command",
      ipWhitelist: ["192.168.1.1"],
      basicAuth: { user: "pass" },
      xff: true,
    };

    config.prepareAndSetArgument(configRef, complexOptions);

    // Verify it was called once
    expect(spy).toHaveBeenCalledTimes(1);

    // Get the actual argument string that was passed
    const actualCall = spy.mock.calls[0];
    const actualConfigRef = actualCall[0];
    const actualArgument = actualCall[1];

    // Verify the configRef
    expect(actualConfigRef).toBe(configRef);

    // Verify the argument string contains all expected parts
    expect(actualArgument).toMatch(/^custom command .+/);
    expect(actualArgument).toContain("w:192.168.1.1");
    expect(actualArgument).toContain("b:user:pass");
    expect(actualArgument).toContain("x:xff");

    spy.mockRestore();
  });
});
