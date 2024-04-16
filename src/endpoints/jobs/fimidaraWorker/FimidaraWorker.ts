import {formatDuration} from 'date-fns';
import {LockableResource} from '../../../utils/LockStore';
import {globalDispose, globalSetup} from '../../contexts/globalUtils';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {FWorker} from '../fworker/FWorker';
import {FWorkerMessager} from '../fworker/FWorkerMessager';
import {runJob} from '../runJob';
import {FimidaraWorkerMessage, kFimidaraWorkerMessageType} from './types';
import {isFimidaraWorkerMessage} from './utils';

const kNoJobSleepForMs = 2 * 60_000; // 2 minutes

export class FimidaraWorker extends FWorker {
  /** Whether this runner thread is scheduled to terminate or not. */
  protected workerEndedLock = new LockableResource<boolean>(false);

  async start() {
    await globalSetup();
    this.getPort().on('message', this.handleMessage);
    this.informMainThreadWorkerIsReady();
    kUtilsInjectables.promises().forget(this.run());
  }

  protected run = async () => {
    await this.workerEndedLock.run(async isWorkerEnded => {
      if (isWorkerEnded) {
        return;
      }

      const wData = this.getWorkerData();
      kUtilsInjectables
        .logger()
        .log(`FimidaraWorker ${wData.workerId} attempting to get next job`);
      const job = await this.getNextJob();

      if (job) {
        kUtilsInjectables
          .logger()
          .log(`FimidaraWorker ${wData.workerId} running job ${job.resourceId}`);
        await runJob(job);
        kUtilsInjectables
          .logger()
          .log(`FimidaraWorker ${wData.workerId} ran job ${job.resourceId}`);
      }

      // Run again if there's a job or wait a bit if there isn't
      const runAgainTimeoutMs = job ? 0 : kNoJobSleepForMs;
      setTimeout(this.run, runAgainTimeoutMs);
      kUtilsInjectables.logger().log(
        `FimidaraWorker ${wData.workerId} running again after ${formatDuration({
          seconds: runAgainTimeoutMs / 1_000,
        })}`
      );
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
      kUtilsInjectables.logger().error(error);
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
        await this.workerEndedLock.run(() => {
          // set workerEndedLock to true to stop the next iteration of
          // this.run()
          return true;
        });

        // Dispose environment
        await globalDispose();

        // Inform main thread worker is ready to terminate
        const ack: FimidaraWorkerMessage = {type: kFimidaraWorkerMessageType.stopWorker};
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
