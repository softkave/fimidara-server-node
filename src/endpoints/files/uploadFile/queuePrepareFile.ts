import {Agent} from '../../../definitions/system.js';
import {queueShardRunner} from '../../../utils/shardRunner/queue.js';
import {kFileConstants} from '../constants.js';
import {IPrepareFileQueueInput, IPrepareFileQueueOutput} from './types.js';

export async function queuePrepareFile(params: {
  input: IPrepareFileQueueInput;
  agent: Agent;
}) {
  const {input, agent} = params;
  const result = await queueShardRunner<
    IPrepareFileQueueInput,
    IPrepareFileQueueOutput
  >({
    agent,
    item: input,
    queueKey: kFileConstants.getPrepareFileQueueKey(input.workspaceId),
    timeoutMs: kFileConstants.prepareFileQueueTimeout,
  });

  return result;
}
