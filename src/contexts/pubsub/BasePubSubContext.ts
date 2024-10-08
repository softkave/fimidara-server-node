import {isObject} from 'lodash-es';
import {AnyFn, AnyObject} from 'softkave-js-utils';
import {kUtilsInjectables} from '../injection/injectables.js';
import {
  IPubSubContext,
  QueueContextSubscribeFn,
  QueueContextSubscribeJsonFn,
} from './types.js';

// @ts-ignore
Error.prototype.toJSON = function () {
  return {
    message: this.message,
    name: this.name,
  };
};

export interface IBasePubSubContextClient {
  subscribe: (channel: string, fn: AnyFn) => Promise<unknown>;
  unsubscribe: (channel?: string, fn?: AnyFn) => Promise<unknown>;
  publish: (channel: string, message: string | Buffer) => Promise<unknown>;
}

export class BasePubSubContext implements IPubSubContext {
  protected subscribeJsonListeners = new Map<string, Map<AnyFn, AnyFn>>();

  constructor(protected client: IBasePubSubContextClient) {}

  publish = async (channel: string, message: string | Buffer | AnyObject) => {
    const pubMessage = this.formatMessageForPublish(message);
    await this.client.publish(channel, pubMessage);
  };

  subscribe = async (channel: string, fn: QueueContextSubscribeFn) => {
    await this.client.subscribe(channel, fn);
  };

  subscribeJson = async (channel: string, fn: QueueContextSubscribeJsonFn) => {
    const jsonListener = (message: string | Buffer, channel: string) => {
      const json = this.formatMessageForListener(message, channel);

      if (json) {
        fn(json, channel);
      }
    };

    await this.subscribe(channel, jsonListener);
    this.setJsonListener(channel, fn, jsonListener);
  };

  unsubscribe = async (channel?: string, fn?: QueueContextSubscribeFn) => {
    const listener =
      channel && fn ? this.getJsonListener(channel, fn) || fn : undefined;
    await this.client.unsubscribe(channel, listener);
  };

  protected formatMessageForPublish(message: string | Buffer | AnyObject) {
    return isObject(message) && !Buffer.isBuffer(message)
      ? JSON.stringify(message)
      : message;
  }

  protected formatMessageForListener(
    message: string | Buffer,
    channel: string
  ) {
    try {
      const strMessage = Buffer.isBuffer(message)
        ? message.toString('utf-8')
        : message;
      return JSON.parse(strMessage) as AnyObject;
    } catch (error) {
      kUtilsInjectables
        .logger()
        .log('Error processing json response from channel', {channel});
      kUtilsInjectables.logger().error(error);

      return undefined;
    }
  }

  protected setJsonListener(channel: string, fn: AnyFn, listener: AnyFn) {
    if (this.subscribeJsonListeners.has(channel)) {
      this.subscribeJsonListeners.get(channel)?.set(fn, listener);
    } else {
      this.subscribeJsonListeners.set(channel, new Map([[fn, listener]]));
    }
  }

  protected getJsonListener(channel: string, fn: AnyFn): AnyFn | undefined {
    return this.subscribeJsonListeners.get(channel)?.get(fn);
  }

  protected unsetJsonListener(channel?: string, fn?: AnyFn) {
    if (channel && fn && this.subscribeJsonListeners.has(channel)) {
      this.subscribeJsonListeners.get(channel)?.delete(fn);

      if (!this.subscribeJsonListeners.get(channel)?.size) {
        this.subscribeJsonListeners.delete(channel);
      }
    }
  }

  protected getClient = () => this.client;
}
