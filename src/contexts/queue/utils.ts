import assert from 'assert';
import {createClient, RedisClientType} from 'redis';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {InMemoryQueueContext} from './InMemoryQueueContext.js';
import {RedisQueueContext} from './RedisQueueContext.js';

export async function getQueueContext(config: FimidaraSuppliedConfig) {
  switch (config.queueProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const queueRedisURL = config.queueRedisURL;
      assert.ok(queueRedisURL);
      const redis: RedisClientType = createClient({url: queueRedisURL});
      await redis.connect();
      return new RedisQueueContext(redis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new InMemoryQueueContext();
    default:
      throw new Error(`Unknown queue type: ${config.queueProvider}`);
  }
}
