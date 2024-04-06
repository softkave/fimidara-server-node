import {LockableResource} from '../../../utils/LockStore';
import {globalDispose} from '../../contexts/globalUtils';
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
    this.getPort().on('message', this.handleMessage);
    this.informMainThreadWorkerIsReady();
    kUtilsInjectables.promises().forget(this.run());
  }

  protected run = async () => {
    await this.workerEndedLock.run(async isWorkerEnded => {
      if (isWorkerEnded) {
        this.dispose();
        return;
      }

      const job = await this.getNextJob();

      if (job) {
        await runJob(job);
      }

      // Run again if there's a job, and wait a bit if there isn't
      setTimeout(this.run, job ? 0 : kNoJobSleepForMs);
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
      });

      if (
        FWorkerMessager.isWorkerTrackedMessage(response) &&
        isFimidaraWorkerMessage(response.value) &&
        response.value.type === kFimidaraWorkerMessageType.getNextJobResponse
      ) {
        return response.value.job;
      }
    } catch (error) {
      console.error(error);
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
        await this.workerEndedLock.run(() => true);
        await globalDispose();

        const ack: FimidaraWorkerMessage = {type: kFimidaraWorkerMessageType.stopWorker};
        this.postTrackedMessage({
          outgoingPort: this.port,
          value: ack,
        });

        setTimeout(() => this.dispose(), 0);
        break;
      }
    }
  };
}
