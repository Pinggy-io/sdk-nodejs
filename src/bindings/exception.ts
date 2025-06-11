import { PinggyNative } from "../types";

export class PinggyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PinggyError";
  }
}

export function initExceptionHandling(addon: PinggyNative): void {
  addon.initExceptionHandling();
}

export function getLastException(addon: PinggyNative): string {
  const exception = addon.getLastException();
  if (exception) {
    throw new PinggyError(exception);
  }
  return exception;
} 