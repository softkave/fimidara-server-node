import {DeleteResourceJobParams, kJobType} from '../../../definitions/job';
import {Agent, Resource, kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {queueJobs} from '../../jobs/queueJobs';

export async function beginDeleteCollaborator(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
  parentJobId?: string;
}) {
  const {workspaceId, resources, agent, parentJobId} = props;
  const jobs = await kSemanticModels.utils().withTxn(async opts => {
    const [, jobs] = await Promise.all([
      kSemanticModels
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
            type: kJobType.deleteResource0,
            params: {
              workspaceId,
              resourceId: resource.resourceId,
              type: kAppResourceType.User,
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
