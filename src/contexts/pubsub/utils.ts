import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {kUtilsInjectables} from '../injection/injectables.js';
import {InMemoryPubSubContext} from './InMemoryPubSubContext.js';
import {RedisPubSubContext} from './RedisPubSubContext.js';

export async function getPubSubContext(config: FimidaraSuppliedConfig) {
  switch (config.pubSubProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const [publisherRedis, subscriberRedis] = kUtilsInjectables.redis();
      return new RedisPubSubContext(publisherRedis, subscriberRedis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new InMemoryPubSubContext();
    default:
      throw new Error(`Unknown PubSub type: ${config.pubSubProvider}`);
  }
}
