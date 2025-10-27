export class AdditionalForwardingManager {
  // Map key: `${remoteAddress}|${localAddress}` -> Array of pending resolvers/rejectors
  private pendingRequests: Map<
    string,
    Array<{ resolve: () => void; reject: (reason?: any) => void }>
  > = new Map();

  // Returns an object with the promise
  enqueue(remoteAddress: string, localAddress: string): { promise: Promise<void> } {
    const key = `${remoteAddress}|${localAddress}`;
    let resolveFn: (() => void) | null = null;
    let rejectFn: ((reason?: any) => void) | null = null;
    const promise = new Promise<void>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
      const arr = this.pendingRequests.get(key) || [];
      const entry = { resolve, reject };
      arr.push(entry);
      this.pendingRequests.set(key, arr);
    });

    return { promise };
  }

  // Resolve the oldest pending for a pair; return true if one was resolved.
  resolveOne(remoteAddress: string, localAddress: string): boolean {
    const key = `${remoteAddress}|${localAddress}`;
    const arr = this.pendingRequests.get(key);
    if (arr && arr.length > 0) {
      const entry = arr.shift();
      if (entry) entry.resolve();
      if (arr.length === 0) this.pendingRequests.delete(key);
      return true;
    }
    return false;
  }

  // Reject the oldest pending for a pair with given reason; return true if one was rejected.
  rejectOne(remoteAddress: string, localAddress: string, reason?: any): boolean {
    const key = `${remoteAddress}|${localAddress}`;
    const arr = this.pendingRequests.get(key);
    if (arr && arr.length > 0) {
      const entry = arr.shift();
      if (entry) entry.reject(reason);
      if (arr.length === 0) this.pendingRequests.delete(key);
      return true;
    }
    return false;
  }

  // Clear all pending promises.
  clearAll(reason?: any): void {
    for (const [key, arr] of this.pendingRequests.entries()) {
      while (arr.length > 0) {
        const e = arr.shift();
        if (e) e.reject(reason);
      }
      this.pendingRequests.delete(key);
    }
  }

}
