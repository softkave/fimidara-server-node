import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {InMemoryPubSubContext} from './InMemoryPubSubContext.js';
import {RedisPubSubContext} from './RedisPubSubContext.js';

export async function getPubSubContext(config: FimidaraSuppliedConfig) {
  switch (config.pubSubProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const [publisherRedis, subscriberRedis] = kIjxUtils.redis();
      return new RedisPubSubContext(publisherRedis, subscriberRedis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new InMemoryPubSubContext();
    default:
      throw new Error(`Unknown PubSub type: ${config.pubSubProvider}`);
  }
}
