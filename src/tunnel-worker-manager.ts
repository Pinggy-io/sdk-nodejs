import { Worker } from "worker_threads";
import path from "path/win32";
import { Logger } from "./utils/logger";
import { PinggyOptions } from "./pinggyOptions";
import { PinggyError } from "./bindings/exception";
import { v4 as uuidv4 } from 'uuid';
import { WorkerMessages, workerMessageType } from "./types";

type PendingCall = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

export class TunnelWorkerManager {
    private worker: Worker;
    private pendingCalls = new Map<string, PendingCall>();
    private ready = false;
    private readyPromise: Promise<void>;
    private callbackHandler?: (event: string, data: any) => void;

    constructor(options: PinggyOptions) {
        const workerPath = path.resolve(__dirname, "tunnel-worker.js").replace(/\\/g, "/");
        this.worker = new Worker(workerPath, { workerData: { options } } as any);

        this.readyPromise = new Promise((resolve, reject) => {
            const onMessage = (msg: WorkerMessages) => {
                if (!msg || typeof msg !== "object") return;
                if (msg.type === workerMessageType.Ready) {
                    this.ready = true;
                    resolve();
                    this.worker.off("message", onMessage);
                } else if (msg.type === workerMessageType.InitError) {
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
        const id = uuidv4();
        return new Promise<any>((resolve, reject) => {
            this.pendingCalls.set(id, { resolve, reject });
            const msg: Extract<WorkerMessages, { type: workerMessageType.Call }> = {
                type: workerMessageType.Call,
                id,
                target,
                method,
                args,
            };
            this.worker.postMessage(msg);
        });
    }

    public async setDebugLoggingInWorker(enable:boolean){
        const msg:Extract<WorkerMessages,{type:workerMessageType.enableLogger}>={
            type:workerMessageType.enableLogger,
            enabled:enable
        }
        this.worker.postMessage(msg);
    }

    public registerCallback(event: string) {
        this.worker.postMessage({ type: workerMessageType.RegisterCallback, event });
    }

    public async terminate(): Promise<number | void> {
        try {
            return await this.worker.terminate();
        } catch (e) {
            Logger.error(`Error terminating TunnelWorker:${e}`);
            return undefined;
        }
    }
    /**
     * Incoming messages from worker thread to main thread
     */
    private registerWorkerListeners(): void {
        this.worker.on("message", (msg: WorkerMessages) => {
            if (!msg || typeof msg !== "object") return;

            switch (msg.type) {
                case workerMessageType.Ready:
                    this.ready = true;
                    Logger.info("TunnelWorker ready.");
                    break;

                case workerMessageType.InitError:
                    Logger.error(`Worker initialization failed:", ${msg.error}`);
                    throw new PinggyError(msg.error);

                case workerMessageType.Response: {
                    const pending = this.pendingCalls.get(msg.id);
                    if (!pending) return;
                    this.pendingCalls.delete(msg.id);
                    if (msg.error) pending.reject(new Error(msg.error));
                    else pending.resolve(msg.result);
                    break;
                }

                case workerMessageType.Callback:
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
        });
    }
}
