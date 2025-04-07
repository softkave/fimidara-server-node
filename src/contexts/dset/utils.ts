import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {MemoryDSetProvider} from './MemoryDSetProvider.js';
import {RedisDSetProvider} from './RedisDSetProvider.js';

export async function getDSetContext(config: FimidaraSuppliedConfig) {
  switch (config.dsetProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const [redis] = kIjxUtils.redis();
      return new RedisDSetProvider(redis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new MemoryDSetProvider();
    default:
      throw new Error(`Unknown dset type: ${config.dsetProvider}`);
  }
}
