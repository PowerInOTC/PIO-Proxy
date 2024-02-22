import { Worker } from 'worker_threads';
import { handleFunctionError } from './sharedUtils';
import { WorkerMessage } from '../types/worker';
import { v4 as uuidv4 } from 'uuid';

class WorkerController {
    private static instances: Map<string, WorkerController> = new Map();
    private worker: Worker | null = null;
    private messageQueue: Map<string, { resolve: (value: WorkerMessage) => void; reject: (reason?: any) => void }> = new Map();

    private constructor(filePath: string) {
        this.worker = new Worker(filePath);

        this.worker.on('message', (message: WorkerMessage) => {
            this.handleWorkerMessage(message);
        });

        this.worker.on('error', (error) => {
            if (error instanceof Error) {
                this.handleWorkerError(`Caught an error: ${error.message}`);
            } else {
                this.handleWorkerError(`Caught an unknown error: ${error}`);
            }
        });

        this.worker.on('exit', (code) => {
            if (code !== 0) {
                this.handleWorkerError(`Worker stopped with exit code ${code}`);
            }
        });

        process.on('exit', () => {
            this.terminateWorker();
            process.exit(0);
        });
    }

    private handleWorkerMessage(message: WorkerMessage) {
        const uuid = message.uuid;
        const promise = this.messageQueue.get(uuid);

        if (promise) {
            this.messageQueue.delete(uuid);

            if (message.type === 'error') {
                promise.reject(new Error(message.payload?.error));
            } else {
                promise.resolve(message);
            }
        }
    }

    private handleWorkerError(error: string) {
        handleFunctionError('worker', 'worker', error);
    }

    public static getInstance(filePath: string): WorkerController {
        if (!WorkerController.instances.has(filePath)) {
            WorkerController.instances.set(filePath, new WorkerController(filePath));
        }

        return WorkerController.instances.get(filePath)!;
    }

    public sendMessageToWorker(message: Partial<WorkerMessage>): Promise<WorkerMessage> {
        const uuid = uuidv4();

        if (!uuid) {
            throw new Error('WorkerMessage must have a uuid.');
        }

        const promise = new Promise<WorkerMessage>((resolve, reject) => {
            this.messageQueue.set(uuid, { resolve, reject });
        });

        message.uuid = uuid;

        this.worker?.postMessage(message);

        return promise;
    }

    terminateWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export default WorkerController;
