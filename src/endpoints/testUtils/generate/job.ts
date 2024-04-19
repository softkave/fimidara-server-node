import {faker} from '@faker-js/faker';
import {kAppPresetShards} from '../../../definitions/app';
import {
  Job,
  JobStatusHistory,
  kJobPresetPriority,
  kJobRunnerV1,
  kJobStatus,
  kJobType,
} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {JobInput} from '../../jobs/queueJobs';
import {getRandomAppType} from './app';

export function getRandomJobType() {
  return faker.helpers.arrayElement(Object.values(kJobType));
}

export function getRandomJobStatus() {
  return faker.helpers.arrayElement(Object.values(kJobStatus));
}

export function getRandomJobPresetPriority() {
  return faker.helpers.arrayElement(Object.values(kJobPresetPriority));
}

export function generateJobInput(seed: Partial<JobInput> = {}): JobInput {
  const params = seed.params || {};
  return {
    params,
    createdBy: kSystemSessionAgent,
    type: getRandomJobType(),
    priority: getRandomJobPresetPriority(),
    shard: getRandomAppType(),
    idempotencyToken: Date.now().toString(),
    ...seed,
  };
}

export function generateJobForTest(seed: Partial<Job> = {}) {
  const createdAt = getTimestamp();
  const params = seed.params || {};
  const status: JobStatusHistory = {
    status: seed.status || getRandomJobStatus(),
    statusLastUpdatedAt: seed.statusLastUpdatedAt || getTimestamp(),
    runnerId: seed.runnerId,
  };
  const job: Job = {
    createdAt,
    params,
    lastUpdatedAt: createdAt,
    createdBy: kSystemSessionAgent,
    resourceId: getNewIdForResource(kFimidaraResourceType.Job),
    type: getRandomJobType(),
    shard: kAppPresetShards.fimidaraMain,
    idempotencyToken: JSON.stringify(params),
    minRunnerVersion: kJobRunnerV1,
    parentJobId: undefined,
    priority: getRandomJobPresetPriority(),
    statusHistory: [status],
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    parents: seed.parentJobId && !seed.parents ? [seed.parentJobId] : [],
    isDeleted: false,
    ...status,
    ...seed,
  };
  return job;
}

export function generateJobListForTest(count = 5, seed: Partial<Job> = {}) {
  const items: Job[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generateJobForTest(seed));
  }

  return items;
}

export async function generateAndInsertJobListForTest(
  count = 5,
  seed: Partial<Job> = {}
) {
  const items = generateJobListForTest(count, seed);
  await kSemanticModels
    .utils()
    .withTxn(
      async opts => kSemanticModels.job().insertItem(items, opts),
      /** reuseTxn */ true
    );

  return items;
}
