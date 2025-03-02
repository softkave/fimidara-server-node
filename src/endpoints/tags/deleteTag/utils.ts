import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {DeleteResourceJobParams, kJobType} from '../../../definitions/job.js';
import {
  Agent,
  Resource,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {queueJobs} from '../../jobs/queueJobs.js';

export async function beginDeleteTag(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
  parentJobId?: string;
}) {
  const {workspaceId, resources, agent, parentJobId} = props;
  const jobs = await kIjxSemantic.utils().withTxn(async opts => {
    const [, jobs] = await Promise.all([
      kIjxSemantic
        .tag()
        .softDeleteManyByIdList(extractResourceIdList(resources), agent, opts),
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
              type: kFimidaraResourceType.Tag,
            },
          };
        })
      ),
    ]);

    return jobs;
  });

  return jobs;
}
