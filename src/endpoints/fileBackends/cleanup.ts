import {CleanupMountResolvedEntriesJobParams, Job} from '../../definitions/job';
import {appAssert} from '../../utils/assertion';
import {kReuseableErrors} from '../../utils/reusableErrors';

export async function runCleanupMountResolvedEntriesJob(
  job: Job<CleanupMountResolvedEntriesJobParams>
) {
  appAssert(job.workspaceId);
  throw kReuseableErrors.common.notImplemented();
}
