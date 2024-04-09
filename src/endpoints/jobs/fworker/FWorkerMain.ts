import console from 'console';
import {noop} from 'lodash';
import {ReadonlyDeep} from 'type-fest';
import {MessageChannel, MessagePort, Worker} from 'worker_threads';
import {PromiseStore} from '../../../utils/PromiseStore';
import {TimeoutError} from '../../../utils/errors';
import {awaitOrTimeout} from '../../../utils/promiseFns';
import {AnyFn} from '../../../utils/types';
import {FWorker, FWorkerData, kFWorkerMessageType} from './FWorker';
import {FWorkerMessager} from './FWorkerMessager';

export interface FWorkerMainWorkerEntry {
  id: string;
  filepath: string;
  worker: Worker;
  workerData: FWorkerData;
  port: MessagePort;
  gracefulTerminateFn: AnyFn<[FWorkerMainWorkerEntry]>;
}

export interface FWorkerMainParams {
  promises: PromiseStore;
}

export abstract class FWorkerMainBase extends FWorkerMessager {
  static awaitWorkerOnline(worker: Worker) {
    return new Promise(resolve => {
      worker.on('online', resolve);
    });
  }

  static awaitWorkerExit(worker: Worker, timeoutMs?: number) {
    return new Promise((resolve, reject) => {
      if (timeoutMs) {
        setTimeout(() => {
          // We don't need a synchronizer, calling resolve() first will make
          // calling reject() later a noop, and vice versa.
          reject(new TimeoutError());
        }, timeoutMs);
      }

      worker.on('exit', resolve);
    });
  }

  protected workers: Record<string, FWorkerMainWorkerEntry | undefined> = {};
  protected promises: PromiseStore;

  constructor(params: FWorkerMainParams) {
    super();
    this.promises = params.promises;
  }

  protected async __startNewWorker(
    filepath: string,
    workerId: string,
    gracefulTerminateFn: AnyFn<[FWorkerMainWorkerEntry]> = noop,
    shouldWaitForWorkerReadyMessage?: boolean
  ) {
    return new Promise<ReadonlyDeep<FWorkerMainWorkerEntry>>(resolve => {
      const {port1: parentPort, port2: workerPort} = new MessageChannel();
      parentPort.on('messageerror', console.error.bind(console));

      const wData: FWorkerData = {workerId, port: workerPort};
      const worker = new Worker(filepath, {
        workerData: wData,
        transferList: [wData.port],
      });

      const wEntry: FWorkerMainWorkerEntry = {
        worker,
        filepath,
        gracefulTerminateFn,
        workerData: wData,
        port: parentPort,
        id: workerId,
      };

      if (shouldWaitForWorkerReadyMessage) {
        const waitForWorkerReadyMessageFn = (message: unknown) => {
          if (
            FWorkerMessager.isWorkerTrackedMessage(message) &&
            FWorker.isFWorkerMessage(message.value) &&
            message.value.type === kFWorkerMessageType.workerReady
          ) {
            parentPort.off('message', waitForWorkerReadyMessageFn);
            resolve(wEntry);
          }
        };

        parentPort.on('message', waitForWorkerReadyMessageFn);
      }

      this.workers[wData.workerId] = wEntry;
      worker.on('online', () => {
        if (!shouldWaitForWorkerReadyMessage) {
          resolve(wEntry);
        }
      });
      worker.on('error', (error: unknown) => {
        console.error(error);
        delete this.workers[workerId];
      });
      worker.on('exit', () => {
        delete this.workers[workerId];
      });
    });
  }

  protected __getWorkers(): ReadonlyDeep<typeof this.workers> {
    return this.workers;
  }

  protected async __stopWorker(id: string, timeoutMs?: number) {
    const wEntry = this.workers[id];

    if (!wEntry) {
      return;
    }

    if (wEntry.gracefulTerminateFn) {
      const terminatePromise = wEntry.gracefulTerminateFn(wEntry);
      console.log('__stopWorker ', timeoutMs);

      if (timeoutMs) {
        this.promises.forget(terminatePromise);
        await awaitOrTimeout(terminatePromise, timeoutMs);
      } else {
        await terminatePromise;
      }
    }

    console.log('__stopWorker before');
    await wEntry.worker.terminate();
    wEntry.port.close();
    delete this.workers[id];
    console.log('__stopWorker');
  }

  protected async __dispose(gracefulTerminateTimeoutMs?: number) {
    await Promise.all(
      Object.keys(this.workers).map(id =>
        this.__stopWorker(id, gracefulTerminateTimeoutMs)
      )
    );
    console.log('__dispose');
  }
}

export class FWorkerMain extends FWorkerMainBase {
  async startNewWorker(
    filepath: string,
    workerId: string,
    gracefulTerminateFn: AnyFn<[FWorkerMainWorkerEntry]> = noop,
    shouldWaitForWorkerReadyMessage?: boolean
  ) {
    return this.__startNewWorker(
      filepath,
      workerId,
      gracefulTerminateFn,
      shouldWaitForWorkerReadyMessage
    );
  }

  getWorkers(): ReadonlyDeep<typeof this.workers> {
    return this.__getWorkers();
  }

  async stopWorker(id: string, timeoutMs?: number) {
    return this.__stopWorker(id, timeoutMs);
  }

  async dispose(gracefulTerminateTimeoutMs?: number) {
    return this.__dispose(gracefulTerminateTimeoutMs);
  }
}
