import {AnyFn} from 'softkave-js-utils';
import {
  BasePubSubContext,
  IBasePubSubContextClient,
} from './BasePubSubContext.js';
import {IPubSubContext} from './types.js';

export class InMemoryPubSubClient implements IBasePubSubContextClient {
  protected listeners = new Map<
    string,
    Set<AnyFn<[message: string | Buffer, channel: string]>>
  >();

  async subscribe(
    channel: string,
    fn: (message: string | Buffer, channel: string) => void
  ) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }

    this.listeners.get(channel)?.add(fn);
  }

  async unsubscribe(
    channel?: string,
    fn?: (message: string | Buffer, channel: string) => void
  ): Promise<void> {
    if (channel) {
      if (fn) {
        this.listeners.get(channel)?.delete(fn);
      } else {
        this.listeners.delete(channel);
      }
    } else {
      this.listeners.clear();
    }
  }

  async publish(channel: string, message: string | Buffer): Promise<void> {
    if (this.listeners.has(channel)) {
      this.listeners.get(channel)?.forEach(fn => fn(message, channel));
    }
  }

  dispose = async () => {
    this.listeners.clear();
  };
}

export class InMemoryPubSubContext
  extends BasePubSubContext
  implements IPubSubContext
{
  constructor() {
    super(new InMemoryPubSubClient());
  }

  dispose = async () => {
    await (this.client as InMemoryPubSubClient).dispose();
  };
}
