import {map} from 'lodash-es';
import {DisposableResource} from 'softkave-js-utils';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kAppType} from '../../../definitions/app.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {FimidaraApp} from '../../app/FimidaraApp.js';
import {kAppConstants} from '../../app/constants.js';
import {FWorkerMainWorkerEntry} from '../fworker/FWorkerMain.js';
import {FWorkerMessager} from '../fworker/FWorkerMessager.js';
import {FWorkerPool} from '../fworker/FWorkerPool.js';
import {getNextJob} from '../getNextJob.js';
import {FimidaraWorkerMessage, kFimidaraWorkerMessageType} from './types.js';
import {isFimidaraWorkerMessage} from './utils.js';

export interface FimidaraWorkerPoolParams {
  server: FimidaraApp;
  workerCount?: number;
  gracefulTerminateTimeoutMs?: number;
}

export class FimidaraWorkerPool implements DisposableResource {
  workerPool: FWorkerPool;
  workerApps: Record<string, FimidaraApp> = {};
  server: FimidaraApp;

  constructor(params: FimidaraWorkerPoolParams) {
    this.server = params.server;

    const runnerLocation = kIjxUtils.suppliedConfig().runnerLocation;
    appAssert(runnerLocation, 'runnerLocation not present in config');
    this.workerPool = new FWorkerPool({
      promises: kIjxUtils.promises(),
      workerCount: params.workerCount || kAppConstants.defaultRunnerCount,
      filepath: runnerLocation,
      gracefulTerminateTimeoutMs:
        params.gracefulTerminateTimeoutMs || 5 * 60 * 1_000, // 5 minutes
      generateWorkerId: () => getNewIdForResource(kFimidaraResourceType.App),
      gracefulTerminateFn: this.gracefulTerminateWorker,
    });
  }

  async startPool() {
    await this.workerPool.ensureWorkerCount();
    const workers = this.workerPool.getWorkers();
    const startWorkerAppsPromiseList = map(workers, async worker => {
      appAssert(worker, 'worker is undefined');
      worker.port.on('message', message =>
        kIjxUtils
          .promises()
          .callAndForget(() => this.handleMessage(worker, message))
      );

      const workerApp = new FimidaraApp({
        appId: getNewIdForResource(kFimidaraResourceType.App),
        shard: this.server.getShard(),
        type: kAppType.runner,
      });
      await workerApp.startApp();
      this.workerApps[worker.id] = workerApp;

      worker.worker.on('exit', () => {
        kIjxUtils.promises().callAndForget(() => workerApp.dispose());
        delete this.workerApps[worker.id];
      });
    });

    await Promise.all(startWorkerAppsPromiseList);
  }

  async dispose() {
    await Promise.all([
      this.workerPool.dispose(),
      ...map(this.workerApps, app => app.dispose()),
    ]);
  }

  protected handleMessage = async (
    wEntry: FWorkerMainWorkerEntry,
    message: unknown
  ) => {
    if (
      !FWorkerMessager.isWorkerTrackedMessage(message) ||
      !isFimidaraWorkerMessage(message.value)
    ) {
      return;
    }

    const {value} = message;

    switch (value.type) {
      case kFimidaraWorkerMessageType.getNextJobRequest: {
        const job = await this.getNextJob(wEntry.workerData.workerId);
        const ackMessage: FimidaraWorkerMessage = {
          job: job || undefined,
          type: kFimidaraWorkerMessageType.getNextJobResponse,
        };

        this.workerPool.postTrackedMessage({
          outgoingPort: wEntry.port,
          value: ackMessage,
          ackMessageFor: message,
        });
        break;
      }
    }
  };

  protected async getNextJob(workerId: string) {
    try {
      return await getNextJob(
        this.server.getActiveAppIdList(),
        workerId,
        /** pick from shards */ [this.server.getShard()]
      );
    } catch (error: unknown) {
      kIjxUtils.logger().error(error);
      return undefined;
    }
  }

  protected gracefulTerminateWorker = async (
    wEntry: FWorkerMainWorkerEntry
  ) => {
    const message: FimidaraWorkerMessage = {
      type: kFimidaraWorkerMessageType.stopWorker,
    };
    await this.workerPool.postTrackedMessage({
      outgoingPort: wEntry.port,
      incomingPort: wEntry.port,
      value: message,
      expectAck: true,
    });
  };
}
