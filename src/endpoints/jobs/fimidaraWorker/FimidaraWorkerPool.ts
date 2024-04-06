import {map} from 'lodash';
import {AppShardId, kAppPresetShards, kAppType} from '../../../definitions/app';
import {kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {DisposableResource} from '../../../utils/disposables';
import {tryFnAsync} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {FimidaraApp} from '../../app/FimidaraApp';
import {kAppConstants} from '../../app/constants';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {FWorkerMainWorkerEntry} from '../fworker/FWorkerMain';
import {FWorkerMessager} from '../fworker/FWorkerMessager';
import {FWorkerPool} from '../fworker/FWorkerPool';
import {getNextJob} from '../getNextJob';
import {FimidaraWorkerMessage, kFimidaraWorkerMessageType} from './types';
import {isFimidaraWorkerMessage} from './utils';

export interface FimidaraWorkerPoolParams {
  server: FimidaraApp;
}

export class FimidaraWorkerPool implements DisposableResource {
  pickFromShards: Array<AppShardId> = [kAppPresetShards.fimidaraMain];
  workerPool: FWorkerPool;
  workerApps: Record<string, FimidaraApp> = {};
  server: FimidaraApp;

  constructor(params: FimidaraWorkerPoolParams) {
    this.server = params.server;

    const runnerLocation = kUtilsInjectables.suppliedConfig().runnerLocation;
    appAssert(runnerLocation);
    this.workerPool = new FWorkerPool({
      promises: kUtilsInjectables.promises(),
      workerCount: kAppConstants.defaultRunnerCount,
      filepath: runnerLocation,
      gracefulTerminateTimeoutMs: 5 * 60 * 1_000, // 5 minutes
      generateWorkerId: () => getNewIdForResource(kFimidaraResourceType.App),
      gracefulTerminateFn: this.gracefulTerminateWorker,
    });
  }

  async startPool() {
    await this.workerPool.ensureWorkerCount();
    const workers = this.workerPool.getWorkers();
    const promises = map(workers, async worker => {
      appAssert(worker);
      worker.port.on('message', message =>
        kUtilsInjectables.promises().forget(this.handleMessage(worker, message))
      );

      const workerApp = new FimidaraApp({
        appId: getNewIdForResource(kFimidaraResourceType.App),
        shard: this.server.getShard(),
        type: kAppType.runner,
      });
      await workerApp.startApp();
      this.workerApps[worker.id] = workerApp;

      worker.worker.on('exit', () => {
        kUtilsInjectables.promises().forget(workerApp.dispose());
        delete this.workerApps[worker.id];
      });
    });

    await Promise.all(promises);
  }

  async dispose() {
    await Promise.all([
      this.workerPool.dispose(),
      ...map(this.workerApps, app => app.dispose()),
    ]);
  }

  protected handleMessage = async (wEntry: FWorkerMainWorkerEntry, message: unknown) => {
    if (
      !FWorkerMessager.isWorkerTrackedMessage(message) ||
      !isFimidaraWorkerMessage(message.value)
    ) {
      return;
    }

    const {value} = message;

    switch (value.type) {
      case kFimidaraWorkerMessageType.getNextJobRequest: {
        const job = await tryFnAsync(() =>
          getNextJob(
            this.server.getActiveAppIdList(),
            wEntry.workerData.workerId,
            this.pickFromShards
          )
        );
        const message: FimidaraWorkerMessage = {
          job: job || undefined,
          type: kFimidaraWorkerMessageType.getNextJobResponse,
        };

        this.workerPool.postTrackedMessage({
          outgoingPort: wEntry.port,
          incomingPort: wEntry.port,
          value: message,
        });
        break;
      }
    }
  };

  protected gracefulTerminateWorker = async (wEntry: FWorkerMainWorkerEntry) => {
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
