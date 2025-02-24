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
    workspaceId: input.workspace.resourceId,
    item: {
      data: {
        multipartId: input.data.multipartId,
        part: input.data.part,
        fileId: input.data.fileId,
        filepath: input.data.filepath,
      },
      workspace: {
        resourceId: input.workspace.resourceId,
        rootname: input.workspace.rootname,
      },
    },
    queueKey: kFileConstants.getPrepareFileQueueKey(input.workspace.resourceId),
    timeoutMs: kFileConstants.prepareFileQueueTimeout,
  });

  return result;
}
