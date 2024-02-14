import {DeleteResourceJobParams, kJobType} from '../../../definitions/job';
import {Agent, Resource, kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {queueJobs} from '../../jobs/queueJobs';

export async function beginDeleteAgentToken(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
}) {
  const {workspaceId, resources, agent} = props;
  const jobs = await kSemanticModels.utils().withTxn(async opts => {
    const [, jobs] = await Promise.all([
      kSemanticModels
        .agentToken()
        .softDeleteManyByIdList(extractResourceIdList(resources), agent, opts),
      queueJobs<DeleteResourceJobParams>(
        workspaceId,
        undefined,
        resources.map(resource => {
          return {
            type: kJobType.deleteResource0,
            params: {
              workspaceId,
              resourceId: resource.resourceId,
              type: kAppResourceType.AgentToken,
            },
          };
        })
      ),
    ]);

    return jobs;
  });

  return jobs;
}
