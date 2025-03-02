import assert from 'assert';
import {Job, kJobType} from '../../../definitions/job.js';
import {FilePersistenceUploadFileResult} from '../../../contexts/file/types.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {handleLastMultipartUpload} from '../../files/uploadFile/multipart.js';

export async function runCompleteMultipartUploadJob(job: Job) {
  assert(job.type === kJobType.completeMultipartUpload);

  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  let size = 0;
  let pMountData:
    | Pick<FilePersistenceUploadFileResult<unknown>, 'filepath' | 'raw'>
    | undefined;

  const completePartResult = await handleLastMultipartUpload({
    file,
    primaryBackend,
    primaryMount,
    filepath,
    data,
  });
  size = completePartResult.size;
  pMountData = completePartResult.pMountData;
}
