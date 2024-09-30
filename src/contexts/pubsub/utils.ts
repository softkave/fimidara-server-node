import assert from 'assert';
import {RedisClientType, createClient} from 'redis';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigPubSubProvider,
} from '../../resources/config.js';
import {InMemoryPubSubContext} from './InMemoryPubSubContext.js';
import {RedisPubSubContext} from './RedisPubSubContext.js';

export async function getPubSubContext(config: FimidaraSuppliedConfig) {
  switch (config.pubSubProvider) {
    case kFimidaraConfigPubSubProvider.redis: {
      const pubSubRedisURL = config.pubSubRedisURL;
      assert.ok(pubSubRedisURL);
      const redis: RedisClientType = createClient({url: pubSubRedisURL});
      await redis.connect();
      return new RedisPubSubContext(redis);
    }
    case kFimidaraConfigPubSubProvider.memory:
      return new InMemoryPubSubContext();
    default:
      throw new Error(`Unknown PubSub type: ${config.pubSubProvider}`);
  }
}
