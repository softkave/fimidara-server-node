import assert from 'assert';
import Redis from 'ioredis';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigRedlockProvider,
} from '../../resources/config.js';
import {MemoryRedlockProvider} from './MemoryRedlockProvider.js';
import {RedisRedlockProvider} from './RedisRedlockProvider.js';

export async function getRedlockContext(config: FimidaraSuppliedConfig) {
  switch (config.redlockProvider) {
    case kFimidaraConfigRedlockProvider.redis: {
      const {redlockRedisURL, redlockDatabase} = config;
      assert.ok(redlockRedisURL);
      const redis = new Redis.default({
        path: redlockRedisURL,
        db: redlockDatabase,
      });
      await redis.connect();
      return new RedisRedlockProvider(redis);
    }
    case kFimidaraConfigRedlockProvider.memory:
      return new MemoryRedlockProvider();
    default:
      throw new Error(`Unknown redlock type: ${config.redlockProvider}`);
  }
}
