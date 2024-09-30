import {RedisClientType} from 'redis';
import {BasePubSubContext} from './BasePubSubContext.js';
import {IPubSubContext} from './types.js';

export class RedisPubSubContext
  extends BasePubSubContext
  implements IPubSubContext
{
  constructor(protected redis: RedisClientType) {
    super(redis);
  }

  dispose = async () => {
    await this.redis.quit();
  };
}
