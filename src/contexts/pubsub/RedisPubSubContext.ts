import {RedisClientType} from 'redis';
import {
  BasePubSubContext,
  IBasePubSubContextClient,
} from './BasePubSubContext.js';
import {IPubSubContext, QueueContextSubscribeFn} from './types.js';

class RedisPubSubClient implements IBasePubSubContextClient {
  constructor(
    protected publisherRedis: RedisClientType,
    protected subscriberRedis: RedisClientType
  ) {}

  async subscribe(channel: string, fn: QueueContextSubscribeFn): Promise<void> {
    await this.subscriberRedis.subscribe(channel, fn);
  }

  async unsubscribe(
    channel?: string,
    fn?: QueueContextSubscribeFn
  ): Promise<void> {
    await this.subscriberRedis.unsubscribe(channel, fn);
  }

  async publish(channel: string, message: string | Buffer): Promise<void> {
    await this.publisherRedis.publish(channel, message);
  }
}

export class RedisPubSubContext
  extends BasePubSubContext
  implements IPubSubContext
{
  constructor(
    protected publisherRedis: RedisClientType,
    protected subscriberRedis: RedisClientType
  ) {
    super(new RedisPubSubClient(publisherRedis, subscriberRedis));
  }

  dispose = async () => {
    await Promise.all([
      this.publisherRedis.quit(),
      this.subscriberRedis.quit(),
    ]);
  };
}
