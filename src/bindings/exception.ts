import { PinggyNative } from "../types";

/**
 * Custom error class for Pinggy-related errors.
 * Extends the standard Error object.
 * @class
 * @extends Error
 */
export class PinggyError extends Error {
  /** @hideconstructor */
  constructor(message: string) {
    super(message);
    this.name = "PinggyError";
  }
}

/**
 * Initializes exception handling for the Pinggy native addon.
 * @param {PinggyNative} addon - The native addon instance.
 * @returns {void}
 */
export function initExceptionHandling(addon: PinggyNative): void {
  addon.initExceptionHandling();
}

/**
 * Retrieves the last exception message from the Pinggy native addon.
 * Throws a PinggyError if an exception is present.
 * @param {PinggyNative} addon - The native addon instance.
 * @returns {string} The last exception message, or an empty string if none.
 * @throws {PinggyError} If an exception is present in the native addon.
 */
export function getLastException(addon: PinggyNative): string {
  const exception = addon.getLastException();
  if (exception) {
    throw new PinggyError(exception);
  }
  return exception;
}
