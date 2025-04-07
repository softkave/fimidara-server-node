import {first} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {Job} from '../../../definitions/job.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {beginDeleteFile} from './beginDeleteFile.js';
import {deleteMultipartUpload} from './deleteMultipartUpload.js';
import {DeleteFileEndpoint} from './types.js';
import {deleteFileJoiSchema} from './validation.js';

const deleteFile: DeleteFileEndpoint = async reqData => {
  const data = validate(reqData.data, deleteFileJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kIjxSemantic.utils().withTxn(async opts => {
    return await getAndCheckFileAuthorization({
      action: kFimidaraPermissionActions.deleteFile,
      incrementPresignedPathUsageCount: true,
      shouldIngestFile: false,
      matcher: data,
      agent,
      opts,
    });
  });

  let job: Job | undefined;
  if (data.clientMultipartId) {
    appAssert(
      file.internalMultipartId,
      new InvalidRequestError('File is not a multipart upload.')
    );

    await deleteMultipartUpload({
      file,
      multipartId: file.internalMultipartId,
      part: data.part,
      shouldCleanupFile: true,
    });

    return {};
  } else {
    const jobs = await beginDeleteFile({
      agent,
      workspaceId: file.workspaceId,
      resources: [file],
    });

    job = first(jobs);
    appAssert(job);
    return {jobId: job.resourceId};
  }
};

export default deleteFile;
