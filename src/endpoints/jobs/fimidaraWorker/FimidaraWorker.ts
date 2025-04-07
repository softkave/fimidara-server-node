import {LockableResource} from 'softkave-js-utils';
import {globalDispose, globalSetup} from '../../../contexts/globalUtils.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {FWorker} from '../fworker/FWorker.js';
import {FWorkerMessager} from '../fworker/FWorkerMessager.js';
import {runJob} from '../runJob.js';
import {FimidaraWorkerMessage, kFimidaraWorkerMessageType} from './types.js';
import {isFimidaraWorkerMessage} from './utils.js';

const kDefaultNoJobSleepForMs = 1 * 60_000; // 1 minute

export class FimidaraWorker extends FWorker {
  /** Whether this runner thread is scheduled to terminate or not. */
  protected workerEndedLock: LockableResource<boolean> | undefined;

  async start() {
    await globalSetup(
      {useFimidaraApp: false, useFimidaraWorkerPool: false},
      {
        useHandleFolderQueue: false,
        useHandleUsageRecordQueue: false,
        useHandleAddInternalMultipartIdQueue: false,
        useHandlePrepareFileQueue: false,
      }
    );
    this.workerEndedLock = new LockableResource<boolean>(
      kIjxUtils.locks(),
      /** resource */ false
    );
    this.getPort().on('message', this.handleMessage);
    this.informMainThreadWorkerIsReady();
    kIjxUtils.logger().log('Started worker ', this.getWorkerData().workerId);
    kIjxUtils.promises().callAndForget(() => this.run());
  }

  protected run = async () => {
    await this.workerEndedLock?.run(async isWorkerEnded => {
      if (isWorkerEnded) {
        return;
      }

      // const wData = this.getWorkerData();
      // kUtilsInjectables
      //   .logger()
      //   .log(`FimidaraWorker ${wData.workerId} attempting to get next job`);
      const job = await this.getNextJob();
      if (job) {
        // kUtilsInjectables
        //   .logger()
        //   .log(`FimidaraWorker ${wData.workerId} running job ${job.resourceId}`);
        await runJob(job);
        // kUtilsInjectables
        //   .logger()
        //   .log(`FimidaraWorker ${wData.workerId} ran job ${job.resourceId}`);
      }

      // Run again if there's a job or wait a bit if there isn't
      const noJobSleepForMs =
        kIjxUtils.suppliedConfig().noJobSleepForMs ?? kDefaultNoJobSleepForMs;
      const runAgainTimeoutMs = job ? 0 : noJobSleepForMs;
      setTimeout(this.run, runAgainTimeoutMs);
      // kUtilsInjectables.logger().log(
      //   `FimidaraWorker ${wData.workerId} running again after ${formatDuration({
      //     seconds: runAgainTimeoutMs / 1_000,
      //   })}`
      // );
    });
  };

  protected async getNextJob() {
    try {
      const getNextJobMessageReq: FimidaraWorkerMessage = {
        type: kFimidaraWorkerMessageType.getNextJobRequest,
      };
      const response = await this.postTrackedMessage({
        outgoingPort: this.port,
        incomingPort: this.port,
        value: getNextJobMessageReq,
        expectAck: true,
        ackTimeoutMs: 10_000,
      });

      if (
        FWorkerMessager.isWorkerTrackedMessage(response) &&
        isFimidaraWorkerMessage(response.value) &&
        response.value.type === kFimidaraWorkerMessageType.getNextJobResponse
      ) {
        return response.value.job;
      }
    } catch (error) {
      kIjxUtils.logger().error(error);
    }

    return undefined;
  }

  protected handleMessage = async (message: unknown) => {
    if (
      !FWorkerMessager.isWorkerTrackedMessage(message) ||
      !isFimidaraWorkerMessage(message.value)
    ) {
      return;
    }

    const {value} = message;

    switch (value.type) {
      case kFimidaraWorkerMessageType.stopWorker: {
        // Wait for workerEndedLock to be available, it's unavailable when
        // this.run() is running
        await this.workerEndedLock?.run(() => {
          // set workerEndedLock to true to stop the next iteration of
          // this.run()
          return true;
        });

        // Dispose environment
        await globalDispose();

        // Inform main thread worker is ready to terminate
        const ack: FimidaraWorkerMessage = {
          type: kFimidaraWorkerMessageType.stopWorker,
        };
        this.postTrackedMessage({
          outgoingPort: this.port,
          value: ack,
          ackMessageFor: message,
        });

        break;
      }
    }
  };
}
