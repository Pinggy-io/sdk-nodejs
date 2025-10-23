import { Worker } from "worker_threads";
import path from "path/win32";
import { Logger } from "./utils/logger";
import { PinggyOptions } from "./pinggyOptions";
import { PinggyError } from "./bindings/exception";

type PendingCall = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

export class TunnelWorkerManager {
    private worker: Worker;
    private nextCallId = 0;
    private pendingCalls = new Map<number, PendingCall>();
    private ready = false;
    private readyPromise: Promise<void>;
    private callbackHandler?: (event: string, data: any) => void;

    constructor(options: PinggyOptions) {
        const workerPath = path.resolve(__dirname, "tunnel-worker.js").replace(/\\/g, "/");
        this.worker = new Worker(workerPath, { workerData: { options } } as any);

        this.readyPromise = new Promise((resolve, reject) => {
            const onMessage = (msg: any) => {
                if (!msg || typeof msg !== "object") return;
                if (msg.type === "ready") {
                    this.ready = true;
                    resolve();
                    this.worker.off("message", onMessage);
                } else if (msg.type === "initError") {
                    reject(new Error(msg.error));
                    this.worker.off("message", onMessage);
                }
            };
            this.worker.on("message", onMessage);
        });

        this.registerWorkerListeners();
    }

    public setCallbackHandler(fn: (event: string, data: any) => void) {
        this.callbackHandler = fn;
    }

    public async ensureReady() {
        if (!this.ready) await this.readyPromise;
    }

    public async call(target: "config" | "tunnel", method: string, ...args: any[]) {
        await this.ensureReady();
        const id = this.nextCallId++;
        return new Promise<any>((resolve, reject) => {
            this.pendingCalls.set(id, { resolve, reject });
            this.worker.postMessage({
                type: "call",
                id,
                method,
                args,
                target,
            });
        });
    }

    public registerCallback(event: string) {
        this.worker.postMessage({ type: "registerCallback", event });
    }

    public async terminate(): Promise<number | void> {
        try {
            return await this.worker.terminate();
        } catch (e) {
            Logger.error(`Error terminating TunnelWorker:${e}`);
            return undefined;
        }
    }

    private registerWorkerListeners(): void {
        this.worker.on("message", (msg) => {
            if (!msg || typeof msg !== "object") return;

            switch (msg.type) {
                case "ready":
                    this.ready = true;
                    Logger.info("TunnelWorker ready.");
                    break;

                case "initError":
                    Logger.error("Worker initialization failed:", msg.error);
                    throw new PinggyError(msg.error);

                case "response": {
                    const pending = this.pendingCalls.get(msg.id);
                    if (!pending) return;
                    this.pendingCalls.delete(msg.id);
                    if (msg.error) pending.reject(new Error(msg.error));
                    else pending.resolve(msg.result);
                    break;
                }

                case "callback":
                    if (this.callbackHandler) this.callbackHandler(msg.event, msg.data);
                    break;

                default:
                    Logger.info(`Unknown message from worker: ${JSON.stringify(msg)}`);
            }
        });

        this.worker.on("error", (err) => {
            Logger.error("TunnelWorker crashed:", err);
        });

        this.worker.on("exit", (code) => {
            Logger.info(`TunnelWorker exited with code ${code}`);
            if (code !== 0) {
                Logger.error("TunnelWorker exited unexpectedly");
            }
        });
    }
}
