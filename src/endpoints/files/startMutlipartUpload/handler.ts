import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {InvalidStateError} from '../../errors.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {IInternalMultipartIdQueueOutput} from '../uploadFile/types.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
import {StartMultipartUploadEndpoint} from './types.js';
import {startMultipartUploadJoiSchema} from './validation.js';

const startMultipartUpload: StartMultipartUploadEndpoint = async reqData => {
  const data = validate(reqData.data, startMultipartUploadJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kSemanticModels.utils().withTxn(async opts => {
    return await getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActions.uploadFile,
      incrementPresignedPathUsageCount: true,
      shouldIngestFile: true,
    });
  });

  if (file.internalMultipartId) {
    throw new InvalidStateError('File already has a pending multipart upload');
  }

  const startMultipartResult = await addMultipartId({
    workspaceId: file.workspaceId,
    namepath: file.namepath,
    fileId: file.resourceId,
    file,
  });

  return {
    multipartId: startMultipartResult.multipartId,
  };
};

export default startMultipartUpload;

async function addMultipartId(params: {
  workspaceId: string;
  namepath: string[];
  fileId: string;
  file: File;
}): Promise<IInternalMultipartIdQueueOutput> {
  const {workspaceId, namepath, fileId, file} = params;

  // TODO: find a way to cache calls to resolveBackendsMountsAndConfigs
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    /** file */ {
      workspaceId,
      namepath,
    },
    /** initPrimaryBackendOnly */ true
  );

  const filepath = await prepareMountFilepath({
    primaryMount,
    file,
  });

  const startMultipartResult = await primaryBackend.startMultipartUpload({
    filepath,
    workspaceId,
    fileId,
    mount: primaryMount,
  });

  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.file().updateOneById(
      fileId,
      {
        internalMultipartId: startMultipartResult.multipartId,
        clientMultipartId: startMultipartResult.multipartId,
      },
      opts
    );
  });

  return startMultipartResult;
}
