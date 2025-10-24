import { Worker } from "worker_threads";
import path from "path/win32";
import { Logger } from "../utils/logger";
import { PinggyOptions } from "../pinggyOptions";
import { v4 as uuidv4 } from 'uuid';
import { PendingCall, WorkerMessage, workerMessageType } from "../types";

/**
 * Manages the dedicated worker thread responsible for running a single Pinggy tunnel instance.
 *
 * Each {@link TunnelInstance} internally owns one {@link TunnelWorkerManager},
 * which isolates the native addon and tunnel execution inside a separate worker thread.
 *
 * This class provides an RPC-style interface for:
 * - Sending method calls (`call`) to the worker for both {@link Config} and {@link Tunnel} operations.
 * - Receiving async responses and callback events from the worker.
 * - Managing worker lifecycle, readiness state, and graceful termination.
 * - Propagating runtime configurations like debug logging to the worker.
 *
 * @internal
 */

export class TunnelWorkerManager {
    private worker: Worker;
    private pendingCalls = new Map<string, PendingCall>();
    private ready = false;
    private readyPromise: Promise<void>;
    private callbackHandler?: (event: string, data: any) => void;

    constructor(pinggyOptions: PinggyOptions) {
        const workerPath = path.resolve(__dirname, "tunnel-worker.js").replace(/\\/g, "/");
        this.worker = new Worker(workerPath, { workerData: { options: pinggyOptions } });

        // First message from worker can either be Ready or InitError
        this.readyPromise = new Promise((resolve, reject) => {
            const onMessage = (msg: WorkerMessage) => {
                if (msg?.type === workerMessageType.Init) {
                    if (msg?.success) {
                        Logger.info("TunnelWorker ready.");
                        this.ready = true;
                        resolve();
                    } else {
                        Logger.error(`Worker initialization failed:", ${msg?.error}`);
                        reject(new Error(msg?.error || undefined))
                    }
                }
                else {
                    Logger.error(`Unexpected message from worker expected Init. Received:", ${msg}`);
                    reject(new Error("Unexpected message"));
                }
                this.worker.off("message", onMessage);
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
            const msg: Extract<WorkerMessage, { type: workerMessageType.Call }> = {
                type: workerMessageType.Call,
                id,
                target,
                method,
                args,
            };
            this.worker.postMessage(msg);
        });
    }

    public async setDebugLoggingInWorker(enable: boolean) {
        const msg: Extract<WorkerMessage, { type: workerMessageType.enableLogger }> = {
            type: workerMessageType.enableLogger,
            enabled: enable
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
        this.worker.on("message", (msg: WorkerMessage) => {
            switch (msg?.type) {
                case workerMessageType.Response: {
                    const pending = this.pendingCalls.get(msg.id);
                    if (!pending) { return };
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
