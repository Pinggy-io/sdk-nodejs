import { TunnelUsageType } from "../types.js";

export class TunnelUsage implements TunnelUsageType {
  elapsedTime: number;
  numLiveConnections: number;
  numTotalConnections: number;
  numTotalReqBytes: number;
  numTotalResBytes: number;
  numTotalTxBytes: number;

  constructor() {
    this.elapsedTime = 0;
    this.numLiveConnections = 0;
    this.numTotalConnections = 0;
    this.numTotalReqBytes = 0;
    this.numTotalResBytes = 0;
    this.numTotalTxBytes = 0;
  }

  updateFromJSON(json: string) {
    const data = JSON.parse(json);

    for (const key of Object.keys(this) as (keyof TunnelUsage)[]) {
      if (key in data) {
        (this[key] as any) = data[key];
      }
    }
  }
}
