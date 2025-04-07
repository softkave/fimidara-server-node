import assert from 'assert';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  CompleteMultipartUploadJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {appAssert} from '../../../utils/assertion.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {handleLastMultipartUpload} from '../../files/uploadFile/multipart.js';
import {prepareMountFilepath} from '../../files/utils/prepareMountFilepath.js';

export async function runCompleteMultipartUploadJob(
  job: Pick<Job, 'type' | 'params'>
) {
  assert(job.type === kJobType.completeMultipartUpload);
  const completeParams = job.params as CompleteMultipartUploadJobParams;
  const file = await kIjxSemantic.file().getOneById(completeParams.fileId);
  appAssert(file);

  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs({
    file,
    initPrimaryBackendOnly: true,
  });

  const mountFilepath = await prepareMountFilepath({primaryMount, file});
  await handleLastMultipartUpload({
    file,
    primaryBackend,
    primaryMount,
    mountFilepath,
    partNumsToUse: completeParams.parts.map(part => ({part: part.part})),
    requestId: completeParams.requestId,
  });
}
