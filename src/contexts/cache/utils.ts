import assert from 'assert';
import {createClient, RedisClientType} from 'redis';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigCacheProvider,
} from '../../resources/config.js';
import {MemoryCacheProvider} from './MemoryCacheProvider.js';
import {RedisCacheProvider} from './RedisCacheProvider.js';

export async function getCacheContext(config: FimidaraSuppliedConfig) {
  switch (config.cacheProvider) {
    case kFimidaraConfigCacheProvider.redis: {
      const {queueRedisURL, queueDatabase} = config;
      assert.ok(queueRedisURL);
      const redis: RedisClientType = createClient({
        url: queueRedisURL,
        database: queueDatabase,
      });
      await redis.connect();
      return new RedisCacheProvider(redis);
    }
    case kFimidaraConfigCacheProvider.memory:
      return new MemoryCacheProvider();
    default:
      throw new Error(`Unknown queue type: ${config.queueProvider}`);
  }
}
