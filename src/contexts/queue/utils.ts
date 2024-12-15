import {isUndefined} from 'lodash-es';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {InMemoryQueueContext} from './InMemoryQueueContext.js';
import {RedisQueueContext} from './RedisQueueContext.js';
import {IQueueMessage, IQueueMessageInternal} from './types.js';
import {kUtilsInjectables} from '../injection/injectables.js';

export async function getQueueContext(config: FimidaraSuppliedConfig) {
  switch (config.queueProvider) {
    case kFimidaraConfigQueueProvider.redis: {
      const [redis] = kUtilsInjectables.redis();
      return new RedisQueueContext(redis);
    }
    case kFimidaraConfigQueueProvider.memory:
      return new InMemoryQueueContext();
    default:
      throw new Error(`Unknown queue type: ${config.queueProvider}`);
  }
}

export function cleanQueueMessages(
  messages: Array<IQueueMessage>
): Array<IQueueMessageInternal> {
  return messages.map(m => {
    const cM: IQueueMessageInternal = {};

    for (const key in m) {
      if (isUndefined(m[key])) {
        continue;
      }

      cM[key] = m[key] as string;
    }

    return cM;
  });
}
