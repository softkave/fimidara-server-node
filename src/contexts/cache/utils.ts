import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {kIkxUtils} from '../ijx/injectables.js';
import {MemoryCacheProvider} from './MemoryCacheProvider.js';
import {RedisCacheProvider} from './RedisCacheProvider.js';

export async function getCacheContext(config: FimidaraSuppliedConfig) {
  switch (config.cacheProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const [redis] = kIkxUtils.redis();
      return new RedisCacheProvider(redis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new MemoryCacheProvider();
    default:
      throw new Error(`Unknown cache type: ${config.cacheProvider}`);
  }
}
