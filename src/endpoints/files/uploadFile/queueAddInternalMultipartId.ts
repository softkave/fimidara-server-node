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
    workspaceId: input.workspaceId,
    item: {
      fileId: input.fileId,
      workspaceId: input.workspaceId,
      mount: input.mount,
      filepath: input.filepath,
      namepath: input.namepath,
    },
    queueKey: kFileConstants.getAddInternalMultipartIdQueueKey(
      input.workspaceId
    ),
    timeoutMs: kFileConstants.addInternalMultipartIdQueueTimeout,
  });

  return result;
}
