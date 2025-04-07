import assert from 'assert';
import {isNumber} from 'lodash-es';
import {Agent} from '../../definitions/system.js';
import {
  singleItemHandleShardQueue,
  startShardRunner,
  stopShardRunner,
} from '../../utils/shardRunner/handler.js';
import {
  IShardRunnerEntry,
  kShardRunnerOutputType,
  ShardRunnerProvidedHandlerResult,
} from '../../utils/shardRunner/types.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {kUsageProviderConstants} from './constants.js';
import {
  IUsageRecordQueueInput,
  IUsageRecordQueueOutput,
  kUsageRecordQueueInputType,
  UsageRecordDecrementInput,
  UsageRecordIncrementInput,
} from './types.js';

async function handleIncrementUsageRecord(params: {
  input: UsageRecordIncrementInput;
  agent: Agent;
}) {
  const {input, agent} = params;
  const result = await kIjxUtils.usage().increment(agent, input);
  return result;
}

async function handleDecrementUsageRecord(params: {
  input: UsageRecordDecrementInput;
  agent: Agent;
}) {
  const {input, agent} = params;
  await kIjxUtils.usage().decrement(agent, input);
}

async function handleUsageRecordEntry(params: {
  entry: IShardRunnerEntry<IUsageRecordQueueInput>;
}): Promise<ShardRunnerProvidedHandlerResult<IUsageRecordQueueOutput>> {
  const {entry} = params;
  const agent = entry.agent;
  const input = entry.item;

  if (input.type === kUsageRecordQueueInputType.increment) {
    const result = await handleIncrementUsageRecord({
      input: input.input,
      agent,
    });
    return {
      type: kShardRunnerOutputType.success,
      item: {
        type: input.type,
        result,
      },
    };
  } else if (input.type === kUsageRecordQueueInputType.decrement) {
    await handleDecrementUsageRecord({input: input.input, agent});
    return {
      type: kShardRunnerOutputType.success,
      item: {
        type: input.type,
        result: undefined,
      },
    };
  }

  throw new Error(`Invalid usage record input type: ${input}`);
}

function getUsageRecordQueueKey(queueNo: number) {
  assert.ok(isNumber(queueNo));
  return kUsageProviderConstants.getAddUsageRecordQueueWithNo(queueNo);
}

async function handleUsageRecordQueue(inputQueueNo: number) {
  const key = getUsageRecordQueueKey(inputQueueNo);
  await singleItemHandleShardQueue({
    queueKey: key,
    readCount: kUsageProviderConstants.addUsageRecordProcessCount,
    providedHandler: async params => {
      return await handleUsageRecordEntry({entry: params.item});
    },
  });
}

export function startHandleUsageRecordQueue(inputQueueNo: number) {
  const key = getUsageRecordQueueKey(inputQueueNo);
  startShardRunner({
    queueKey: key,
    handlerFn: () => handleUsageRecordQueue(inputQueueNo),
  });
}

// TODO: currently not used
export async function stopHandleUsageRecordQueue(inputQueueNo: number) {
  const key = getUsageRecordQueueKey(inputQueueNo);
  await stopShardRunner({queueKey: key});
}
