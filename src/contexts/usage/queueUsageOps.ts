import assert from 'assert';
import {Agent} from '../../definitions/system.js';
import {queueShardRunner} from '../../utils/shardRunner/queue.js';
import {kUsageProviderConstants} from './constants.js';
import {
  IUsageRecordQueueInput,
  IUsageRecordQueueOutput,
  kUsageRecordQueueInputType,
  UsageRecordDecrementInput,
  UsageRecordIncrementInput,
} from './types.js';

export async function queueIncrementUsageRecord(params: {
  input: UsageRecordIncrementInput;
  agent: Agent;
}) {
  const {input, agent} = params;
  const queueInput: IUsageRecordQueueInput = {
    type: kUsageRecordQueueInputType.increment,
    input: {
      category: input.category,
      workspaceId: input.workspaceId,
      usage: input.usage,
      artifacts: input.artifacts,
      usageResourceId: input.usageResourceId,
    },
  };

  const result = await queueShardRunner<
    IUsageRecordQueueInput,
    IUsageRecordQueueOutput
  >({
    agent,
    item: queueInput,
    queueKey: kUsageProviderConstants.getAddUsageRecordQueueKey(
      input.workspaceId
    ),
    timeoutMs: kUsageProviderConstants.addUsageRecordQueueTimeout,
  });

  assert.ok(result.type === kUsageRecordQueueInputType.increment);
  return result.result;
}

export async function queueDecrementUsageRecord(params: {
  input: UsageRecordDecrementInput;
  agent: Agent;
}) {
  const {input, agent} = params;
  const queueInput: IUsageRecordQueueInput = {
    type: kUsageRecordQueueInputType.decrement,
    input,
  };

  await queueShardRunner({
    agent,
    item: queueInput,
    queueKey: kUsageProviderConstants.getAddUsageRecordQueueKey(
      input.workspaceId
    ),
    timeoutMs: kUsageProviderConstants.addUsageRecordQueueTimeout,
  });
}
