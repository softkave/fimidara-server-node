import {ReadonlyDeep} from 'type-fest';
import {appAssert} from '../../../utils/assertion.js';
import {kLoopAsyncSettlementType, loopAsync} from '../../../utils/fns.js';
import {AnyFn} from '../../../utils/types.js';
import {FWorkerMainBase, FWorkerMainParams} from './FWorkerMain.js';
import {DisposableResource} from 'softkave-js-utils';

export interface FWorkerPoolParams extends FWorkerMainParams {
  workerCount: number;
  filepath: string;
  generateWorkerId: AnyFn<[], string>;
  gracefulTerminateFn?: AnyFn;
  gracefulTerminateTimeoutMs?: number;
}

export class FWorkerPool extends FWorkerMainBase implements DisposableResource {
  protected workerCount: number;
  protected filepath: string;
  protected generateWorkerId: AnyFn<[], string>;
  protected gracefulTerminateFn?: AnyFn;
  protected gracefulTerminateTimeoutMs?: number;

  constructor(params: FWorkerPoolParams) {
    super(params);
    appAssert(params.workerCount >= 0, 'workerCount should be >= 0');
    this.workerCount = params.workerCount;
    this.filepath = params.filepath;
    this.generateWorkerId = params.generateWorkerId;
    this.gracefulTerminateFn = params.gracefulTerminateFn;
    this.gracefulTerminateTimeoutMs = params.gracefulTerminateTimeoutMs;
  }

  async ensureWorkerCount() {
    const workerIds = Object.keys(this.workers);
    const currentWorkerCount = workerIds.length;

    if (currentWorkerCount < this.workerCount) {
      const count = this.workerCount - currentWorkerCount;
      await loopAsync(this.startNewWorker, count, kLoopAsyncSettlementType.all);
    } else {
      await Promise.all(workerIds.slice(this.workerCount).map(this.stopWorker));
    }
  }

  async dispose() {
    await this.__dispose(this.gracefulTerminateTimeoutMs);
  }

  protected startNewWorker = async () => {
    const id = this.generateWorkerId();
    return await this.__startNewWorker(
      this.filepath,
      id,
      this.gracefulTerminateFn,
      /** shouldWaitForWorkerReadyMessage */ true
    );
  };

  protected stopWorker = async (id: string) => {
    await this.__stopWorker(id, this.gracefulTerminateTimeoutMs);
  };

  getWorkers(): ReadonlyDeep<typeof this.workers> {
    return this.__getWorkers();
  }
}
