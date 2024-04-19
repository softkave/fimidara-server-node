import {kJobType} from '../../../definitions/job';
import {Agent} from '../../../definitions/system';
import {queueJobs} from '../../jobs/queueJobs';
import {DeletePermissionItemInput} from './types';

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
