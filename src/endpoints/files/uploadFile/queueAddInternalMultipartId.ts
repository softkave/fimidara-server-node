import {Agent} from '../../../definitions/system.js';
import {queueShardRunner} from '../../../utils/shardRunner/queue.js';
import {kFileConstants} from '../constants.js';
import {
  IInternalMultipartIdQueueInput,
  IInternalMultipartIdQueueOutput,
} from './types.js';

export async function queueAddInternalMultipartId(params: {
  input: IInternalMultipartIdQueueInput;
  agent: Agent;
}) {
  const {input, agent} = params;
  const result = await queueShardRunner<
    IInternalMultipartIdQueueInput,
    IInternalMultipartIdQueueOutput
  >({
    agent,
    item: {
      fileId: input.fileId,
      workspaceId: input.workspaceId,
      mount: input.mount,
      mountFilepath: input.mountFilepath,
      namepath: input.namepath,
      clientMultipartId: input.clientMultipartId,
    },
    queueKey: kFileConstants.getAddInternalMultipartIdQueueKey(
      input.workspaceId
    ),
    timeoutMs: kFileConstants.addInternalMultipartIdQueueTimeout,
  });

  return result;
}
