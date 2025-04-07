import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {MemoryRedlockProvider} from './MemoryRedlockProvider.js';
import {RedisRedlockProvider} from './RedisRedlockProvider.js';

export async function getRedlockContext(config: FimidaraSuppliedConfig) {
  switch (config.redlockProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const [ioRedis] = kIjxUtils.ioredis();
      return new RedisRedlockProvider(ioRedis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new MemoryRedlockProvider();
    default:
      throw new Error(`Unknown redlock type: ${config.redlockProvider}`);
  }
}
