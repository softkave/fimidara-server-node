import assert from 'assert';
import {isObject} from 'lodash';
import {ReadonlyDeep, ValueOf} from 'type-fest';
import {MessagePort, isMainThread, workerData} from 'worker_threads';
import {DisposableResource} from '../../../utils/disposables';
import {FWorkerMessager} from './FWorkerMessager';

export interface FWorkerData {
  workerId: string;
  port: MessagePort;
}

export const kFWorkerMessageType = {
  workerReady: 'workerReady',
} as const;

export type FWorkerMessageType = ValueOf<typeof kFWorkerMessageType>;

export type FWorkerMessage = {type: typeof kFWorkerMessageType.workerReady};

export class FWorker extends FWorkerMessager implements DisposableResource {
  static isWorkerData(data: unknown): data is FWorkerData {
    return (
      isObject(data) && !!(data as FWorkerData).workerId && !!(data as FWorkerData).port
    );
  }

  static isFWorkerMessage(message: unknown): message is FWorkerMessage {
    return isObject(message) && !!(message as FWorkerMessage).type;
  }

  protected port: MessagePort;

  constructor() {
    super();
    this.port = this.getWorkerData().port;
    this.port.on('messageerror', console.error.bind(console));
  }

  getWorkerData(): ReadonlyDeep<FWorkerData> {
    assert(FWorker.isWorkerData(workerData));
    return workerData;
  }

  getPort(): ReadonlyDeep<MessagePort> {
    return this.port;
  }

  dispose() {
    if (!isMainThread) {
      // eslint-disable-next-line no-process-exit
      process.exit();
    }
  }

  informMainThreadWorkerIsReady() {
    const workerReadyMessage: FWorkerMessage = {type: kFWorkerMessageType.workerReady};
    this.postTrackedMessage({
      outgoingPort: this.port,
      incomingPort: this.port,
      value: workerReadyMessage,
    });
  }
}
