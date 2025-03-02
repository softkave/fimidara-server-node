import {faker} from '@faker-js/faker';
import {difference} from 'lodash-es';
import {convertToArray} from 'softkave-js-utils';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kAppPresetShards} from '../../../definitions/app.js';
import {
  Job,
  JobStatus,
  JobStatusHistory,
  kJobPresetPriority,
  kJobRunnerV1,
  kJobStatus,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource, newResource} from '../../../utils/resource.js';
import {JobInput} from '../../jobs/queueJobs.js';
import {getRandomAppType} from './app.js';

export function getRandomJobType() {
  return faker.helpers.arrayElement(Object.values(kJobType));
}

export function getRandomJobStatus(excludeFrom?: JobStatus | JobStatus[]) {
  return faker.helpers.arrayElement(
    difference(Object.values(kJobStatus), convertToArray(excludeFrom || []))
  );
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
  const params = seed.params || {};
  const status: JobStatusHistory = {
    status: seed.status || getRandomJobStatus(),
    statusLastUpdatedAt: seed.statusLastUpdatedAt || getTimestamp(),
    runnerId: seed.runnerId,
  };
  const job: Job = newResource<Job>(kFimidaraResourceType.Job, {
    params,
    type: getRandomJobType(),
    shard: kAppPresetShards.fimidaraMain,
    idempotencyToken: JSON.stringify(params),
    minRunnerVersion: kJobRunnerV1,
    parentJobId: undefined,
    priority: getRandomJobPresetPriority(),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    parents: seed.parentJobId && !seed.parents ? [seed.parentJobId] : [],
    ...status,
    ...seed,
  });
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
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.job().insertItem(items, opts));

  return items;
}
