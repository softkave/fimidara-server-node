import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {DeleteResourceJobParams, kJobType} from '../../../definitions/job.js';
import {
  Agent,
  Resource,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {queueJobs} from '../../jobs/queueJobs.js';

export async function beginDeleteCollaborator(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
  parentJobId?: string;
}) {
  const {workspaceId, resources, agent, parentJobId} = props;
  const jobs = await kIjxSemantic.utils().withTxn(async opts => {
    const [, jobs] = await Promise.all([
      kIjxSemantic
        .assignedItem()
        .softDeleteWorkspaceCollaborators(
          workspaceId,
          extractResourceIdList(resources),
          agent,
          opts
        ),
      queueJobs<DeleteResourceJobParams>(
        workspaceId,
        parentJobId,
        resources.map(resource => {
          return {
            createdBy: agent,
            type: kJobType.deleteResource,
            idempotencyToken: Date.now().toString(),
            params: {
              workspaceId,
              resourceId: resource.resourceId,
              type: kFimidaraResourceType.User,
              isRemoveCollaborator: true,
            },
          };
        })
      ),
    ]);

    return jobs;
  });

  return jobs;
}
