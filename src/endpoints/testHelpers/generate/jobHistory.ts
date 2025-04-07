import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {JobHistory} from '../../../definitions/jobHistory.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getNewIdForResource, newResource} from '../../../utils/resource.js';
import {getRandomJobStatus} from './job.js';

export function generateJobHistoryForTest(seed: Partial<JobHistory> = {}) {
  const jobHistory: JobHistory = newResource<JobHistory>(
    kFimidaraResourceType.jobHistory,
    {
      jobId: getNewIdForResource(kFimidaraResourceType.Job),
      workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
      status: getRandomJobStatus(),
      ...seed,
    }
  );
  return jobHistory;
}

export function generateJobHistoryListForTest(
  count = 5,
  seed: Partial<JobHistory> = {}
) {
  const items: JobHistory[] = [];

  for (let i = 0; i < count; i++) {
    items.push(generateJobHistoryForTest(seed));
  }

  return items;
}

export async function generateAndInsertJobHistoryListForTest(
  count = 5,
  seed: Partial<JobHistory> = {}
) {
  const items = generateJobHistoryListForTest(count, seed);
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.jobHistory().insertItem(items, opts));

  return items;
}
