import {RedisClientType} from 'redis';
import {
  BasePubSubContext,
  IBasePubSubContextClient,
} from './BasePubSubContext.js';
import {IPubSubContext} from './types.js';

class RedisPubSubClient implements IBasePubSubContextClient {
  constructor(
    protected publisherRedis: RedisClientType,
    protected subscriberRedis: RedisClientType
  ) {}

  async subscribe(
    channel: string,
    fn: (message: string | Buffer, channel: string) => void
  ) {
    return await this.subscriberRedis.subscribe(channel, fn);
  }

  async unsubscribe(
    channel?: string,
    fn?: (message: string | Buffer, channel: string) => void
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
}
