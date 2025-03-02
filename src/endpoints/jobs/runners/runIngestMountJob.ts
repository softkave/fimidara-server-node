import assert from 'assert';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {appAssert} from '../../../utils/assertion.js';
import {JobInput, queueJobs} from '../queueJobs.js';

export async function runIngestMountJob(job: Job) {
  assert(job.type === kJobType.ingestMount);
  appAssert(job.workspaceId, 'workspaceId not present in job');

  const mount = await kIjxSemantic
    .fileBackendMount()
    .getOneById(job.params.mountId);

  if (!mount || mount.backend === kFileBackendType.fimidara) {
    return;
  }

  const input: JobInput<IngestFolderpathJobParams> = {
    shard: job.shard,
    createdBy: job.createdBy,
    type: kJobType.ingestFolderpath,
    idempotencyToken: Date.now().toString(),
    params: {ingestFrom: mount.mountedFrom, mountId: mount.resourceId},
  };

  await queueJobs(job.workspaceId, job.resourceId, [input]);
}
