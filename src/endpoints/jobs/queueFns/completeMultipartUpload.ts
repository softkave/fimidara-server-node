import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {
  CompleteMultipartUploadJobParams,
  kJobType,
} from '../../../definitions/job.js';
import {Agent} from '../../../definitions/system.js';
import {CompleteMultipartUploadInputPart} from '../../files/completeMultipartUpload/types.js';
import {queueJobs} from '../queueJobs.js';

export async function queueCompleteMultipartUploadJob(props: {
  workspaceId: string;
  fileId: string;
  parts: CompleteMultipartUploadInputPart[];
  agent: Agent;
  parentJobId?: string;
  opts?: SemanticProviderMutationParams;
  requestId: string;
}) {
  const {workspaceId, fileId, parts, agent, parentJobId, opts, requestId} =
    props;

  const completeParams: CompleteMultipartUploadJobParams = {
    fileId,
    parts,
    requestId,
  };

  const [job] = await queueJobs<CompleteMultipartUploadJobParams>(
    workspaceId,
    parentJobId,
    {
      createdBy: agent,
      type: kJobType.completeMultipartUpload,
      idempotencyToken: Date.now().toString(),
      params: completeParams,
    },
    {opts}
  );

  return job;
}
