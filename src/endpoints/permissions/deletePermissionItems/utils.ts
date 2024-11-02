import {kJobType} from '../../../definitions/job.js';
import {Agent} from '../../../definitions/system.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {DeletePermissionItemInput} from './types.js';

export async function beginDeletePermissionItemByInput(props: {
  workspaceId: string;
  items: DeletePermissionItemInput[];
  agent: Agent;
  parentJobId?: string;
}) {
  const {workspaceId, items, agent, parentJobId} = props;
  return queueJobs<DeletePermissionItemInput>(
    workspaceId,
    parentJobId,
    items.map(item => {
      return {
        type: kJobType.deletePermissionItem,
        params: item,
        createdBy: agent,
        idempotencyToken: Date.now().toString(),
      };
    })
  );
}
