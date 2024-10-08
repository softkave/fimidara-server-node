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
      const publisherRedis: RedisClientType = createClient({
        url: pubSubRedisURL,
      });
      const subscriberRedis: RedisClientType = createClient({
        url: pubSubRedisURL,
      });
      await Promise.all([publisherRedis.connect(), subscriberRedis.connect()]);
      return new RedisPubSubContext(publisherRedis, subscriberRedis);
    }
    case kFimidaraConfigPubSubProvider.memory:
      return new InMemoryPubSubContext();
    default:
      throw new Error(`Unknown PubSub type: ${config.pubSubProvider}`);
  }
}
