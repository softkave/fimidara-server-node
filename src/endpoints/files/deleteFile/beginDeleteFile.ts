import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {DeleteResourceJobParams, kJobType} from '../../../definitions/job.js';
import {
  Agent,
  Resource,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {queueJobs} from '../../jobs/queueJobs.js';

async function queueDeletFileJob(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
  parentJobId?: string;
  opts: SemanticProviderMutationParams;
}) {
  const {workspaceId, resources, agent, parentJobId, opts} = props;
  const jobs = await queueJobs<DeleteResourceJobParams>(
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
          type: kFimidaraResourceType.File,
        },
      };
    }),
    {opts}
  );

  return jobs;
}

export async function softDeleteFile(props: {
  resources: Resource[];
  agent: Agent;
  opts: SemanticProviderMutationParams;
}) {
  const {resources, agent, opts} = props;
  await kIjxSemantic
    .file()
    .softDeleteManyByIdList(extractResourceIdList(resources), agent, opts);
}

export async function beginDeleteFile(props: {
  workspaceId: string;
  resources: Resource[];
  agent: Agent;
  parentJobId?: string;
}) {
  const {workspaceId, resources, agent, parentJobId} = props;
  const jobs = await kIjxSemantic.utils().withTxn(async opts => {
    const [, jobs] = await Promise.all([
      softDeleteFile({resources, agent, opts}),
      queueDeletFileJob({workspaceId, resources, agent, parentJobId, opts}),
    ]);

    return jobs;
  });

  return jobs;
}
