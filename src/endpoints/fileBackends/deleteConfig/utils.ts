import {DeleteResourceJobParams, kJobType} from '../../../definitions/job';
import {Agent, Resource, kFimidaraResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {queueJobs} from '../../jobs/queueJobs';

export async function beginDeleteFileBackendConfig(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
  parentJobId?: string;
}) {
  const {workspaceId, resources, agent, parentJobId} = props;
  const jobs = await kSemanticModels.utils().withTxn(async opts => {
    const [, jobs] = await Promise.all([
      kSemanticModels
        .fileBackendConfig()
        .softDeleteManyByIdList(extractResourceIdList(resources), agent, opts),
      queueJobs<DeleteResourceJobParams>(
        workspaceId,
        parentJobId,
        resources.map(resource => {
          return {
            createdBy: agent,
            type: kJobType.deleteResource0,
            idempotencyToken: Date.now().toString(),
            params: {
              workspaceId,
              resourceId: resource.resourceId,
              type: kFimidaraResourceType.FileBackendConfig,
            },
          };
        })
      ),
    ]);

    return jobs;
  }, /** reuseTxn */ true);

  return jobs;
}
