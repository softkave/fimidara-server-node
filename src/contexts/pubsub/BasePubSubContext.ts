import {isObject} from 'lodash-es';
import {AnyFn, AnyObject} from 'softkave-js-utils';
import {kIjxUtils} from '../ijx/injectables.js';
import {
  IPubSubContext,
  IPubSubSubscription,
  QueueContextSubscribeFn,
  QueueContextSubscribeJsonFn,
} from './types.js';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof Error.prototype.toJSON !== 'function') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  Error.prototype.toJSON = function () {
    return {
      message: this.message,
      name: this.name,
      // stack: this.stack,
    };
  };
}

export interface IBasePubSubContextClient {
  subscribe: (channel: string, fn: AnyFn) => Promise<unknown>;
  unsubscribe: (channel?: string, fn?: AnyFn) => Promise<unknown>;
  publish: (channel: string, message: string | Buffer) => Promise<unknown>;
}

export class BasePubSubContext implements IPubSubContext {
  protected listeners = new Map<string, Map<AnyFn, AnyFn>>();

  constructor(protected client: IBasePubSubContextClient) {}

  publish = async (channel: string, message: string | Buffer | AnyObject) => {
    const pubMessage = this.formatMessageForPublish(message);
    await this.client.publish(channel, pubMessage);
  };

  subscribe = async (
    channel: string,
    fn: QueueContextSubscribeFn
  ): Promise<IPubSubSubscription> => {
    const subscription: IPubSubSubscription = {
      unsubscribe: () => this.unsubscribeWithFn(channel, fn),
    };
    const listener = (message: string | Buffer, channel: string) => {
      fn(message, channel, subscription);
    };
    this.setListener(channel, fn, listener);
    await this.client.subscribe(channel, listener);
    return subscription;
  };

  subscribeJson = async (channel: string, fn: QueueContextSubscribeJsonFn) => {
    const subscription: IPubSubSubscription = {
      unsubscribe: () => this.unsubscribeWithFn(channel, fn),
    };
    const jsonListener = (message: string | Buffer, channel: string) => {
      const json = this.formatMessageForListener(message, channel);

      if (json) {
        fn(json, channel, subscription);
      }
    };

    await this.subscribe(channel, jsonListener);
    this.setListener(channel, fn, jsonListener);
    return subscription;
  };

  unsubscribe = async (channel?: string, fn?: QueueContextSubscribeFn) => {
    const listener =
      channel && fn ? this.getListener(channel, fn) || fn : undefined;
    await this.client.unsubscribe(channel, listener);

    if (channel && fn) {
      this.unsubscribeWithFn(channel, fn);
    } else if (channel) {
      this.client.unsubscribe(channel);
    }
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
      kIjxUtils
        .logger()
        .log('Error processing json response from channel', {channel});
      kIjxUtils.logger().error(error);

      return undefined;
    }
  }

  protected setListener(channel: string, fn: AnyFn, listener: AnyFn) {
    if (this.listeners.has(channel)) {
      this.listeners.get(channel)?.set(fn, listener);
    } else {
      this.listeners.set(channel, new Map([[fn, listener]]));
    }
  }

  protected getListener(channel: string, fn: AnyFn): AnyFn | undefined {
    return this.listeners.get(channel)?.get(fn);
  }

  protected unsetListener(channel?: string, fn?: AnyFn) {
    if (channel && fn && this.listeners.has(channel)) {
      this.listeners.get(channel)?.delete(fn);

      if (!this.listeners.get(channel)?.size) {
        this.listeners.delete(channel);
      }
    }
  }

  protected unsubscribeWithFn(channel: string, fn: AnyFn) {
    const listener = this.getListener(channel, fn);
    if (listener) {
      this.unsubscribe(channel, listener);
      this.unsetListener(channel, fn);
    }
  }

  protected getClient = () => this.client;
}
