import {isObject} from 'lodash-es';
import {AnyFn, AnyObject} from 'softkave-js-utils';
import {MessagePort, TransferListItem} from 'worker_threads';
import {appAssert} from '../../../utils/assertion.js';
import {TimeoutError} from '../../../utils/errors.js';
import {getNewId} from '../../../utils/resource.js';

export interface FWorkerTrackedMessage {
  messageId: string;
  value: unknown;
}

export interface FWorkerMessagerPostTrackedMessageParams {
  outgoingPort: MessagePort;
  incomingPort?: MessagePort;
  /** see `postMessage` function on {@link MessagePort} */
  value: unknown;
  transferList?: readonly TransferListItem[];
  /** If true, waits until message is ack-ed before resolving. Otherwise
   * resolve once message is posted. */
  expectAck?: boolean;
  /** How long to wait for ack message. Always supply a timeout, if the
   * default does not work for you. */
  ackTimeoutMs?: number;
  ackMessageFor?: FWorkerTrackedMessage;
}

export class FWorkerMessager {
  static isWorkerTrackedMessage(
    message: unknown
  ): message is FWorkerTrackedMessage {
    return isObject(message) && !!(message as FWorkerTrackedMessage).messageId;
  }

  protected acks: Record<
    string,
    {resolveFn: AnyFn; rejectFn: AnyFn} | undefined
  > = {};
  protected messagePortSignature = `fworkerMessager_${Math.random()}`;

  async postTrackedMessage(params: FWorkerMessagerPostTrackedMessageParams) {
    const {
      outgoingPort,
      incomingPort,
      value,
      transferList,
      ackMessageFor,
      expectAck = false,
      ackTimeoutMs = /** 5 seconds */ 5_000,
    } = params;

    return new Promise<unknown>((resolve, reject) => {
      let message: FWorkerTrackedMessage;

      if (FWorkerMessager.isWorkerTrackedMessage(value)) {
        message = value;
        message.messageId = ackMessageFor?.messageId || message.messageId;
      } else {
        const messageId = ackMessageFor?.messageId || getNewId();
        message = {messageId, value};
      }

      if (expectAck) {
        appAssert(
          incomingPort,
          'incomingPort must be provided if expectAck is true'
        );
        this.bindHandleAck(incomingPort);
        this.acks[message.messageId] = {resolveFn: resolve, rejectFn: reject};

        if (ackTimeoutMs) {
          setTimeout(() => {
            if (this.acks[message.messageId]) {
              delete this.acks[message.messageId];
              reject(new TimeoutError());
            }
          }, ackTimeoutMs);
        }
      }

      outgoingPort.postMessage(message, transferList);

      if (!expectAck) {
        // Resolve early if we are not expecting ack
        resolve(undefined);
      }
    });
  }

  protected bindHandleAck = (port: MessagePort) => {
    if (!this.isHandleAckBoundToPort(port)) {
      port.on('message', this.handleAcks);
      (port as AnyObject)[this.messagePortSignature] = true;
    }
  };

  protected unbindHandleAck = (port: MessagePort) => {
    port.off('message', this.handleAcks);
    delete (port as AnyObject)[this.messagePortSignature];
  };

  protected isHandleAckBoundToPort(port: MessagePort) {
    return !!(port as AnyObject)[this.messagePortSignature];
  }

  /** Bind to a port's on("message") handler */
  protected handleAcks = (message: unknown) => {
    if (!FWorkerMessager.isWorkerTrackedMessage(message)) {
      return;
    }

    const ack = this.acks[message.messageId];

    if (ack) {
      delete this.acks[message.messageId];
      ack.resolveFn(message);
    }
  };
}
