import {isString} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {resolveBackendsMountsAndConfigs} from '../../fileBackends/mountUtils.js';
import {completeUploadFile} from '../uploadFile/update.js';
import {handleFinalStorageUsageRecords} from '../uploadFile/usage.js';
import {fileExtractor, getAndCheckFileAuthorization} from '../utils.js';
import {
  deleteMultipartUploadPartMetas,
  getMultipartUploadPartMetas,
} from '../utils/multipartUploadMeta.js';
import {prepareMountFilepath} from '../utils/prepareMountFilepath.js';
import {CompleteMultipartUploadEndpoint} from './types.js';
import {completeMultipartUploadJoiSchema} from './validation.js';

const completeMultipartUpload: CompleteMultipartUploadEndpoint =
  async reqData => {
    const data = validate(reqData.data, completeMultipartUploadJoiSchema);
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
        incrementPresignedPathUsageCount: false,
        shouldIngestFile: false,
      });
    });

    const result = await handleCompleteMultipartUpload({file, agent});
    await handleFinalStorageUsageRecords({
      reqData,
      file,
      size: result.size,
    });

    return {file: fileExtractor(result)};
  };

export default completeMultipartUpload;

async function handleCompleteMultipartUpload(params: {
  file: File;
  agent: SessionAgent;
}) {
  const {file, agent} = params;
  const multipartId = file.multipartId;

  // TODO: find a way to cache calls to resolveBackendsMountsAndConfigs
  const {primaryMount, primaryBackend} = await resolveBackendsMountsAndConfigs(
    file,
    /** initPrimaryBackendOnly */ true
  );

  appAssert(isString(multipartId));
  const parts = await getMultipartUploadPartMetas({
    multipartId,
  });

  const backendFilepath = await prepareMountFilepath({primaryMount, file});
  const completeMultipartResult = await primaryBackend.completeMultipartUpload({
    parts,
    filepath: backendFilepath,
    fileId: file.resourceId,
    multipartId,
    mount: primaryMount,
    workspaceId: file.workspaceId,
  });

  kUtilsInjectables.promises().callAndForget(() =>
    deleteMultipartUploadPartMetas({
      multipartId,
    })
  );

  const size = parts.reduce((acc, part) => acc + part.size, 0);
  const update: Partial<File> = {
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    lastUpdatedAt: getTimestamp(),
    isWriteAvailable: true,
    isReadAvailable: true,
    version: file.version + 1,
    size,
  };

  const savedFile = await completeUploadFile({
    agent,
    file,
    primaryMount,
    update,
    shouldInsertMountEntry: true,
    raw: completeMultipartResult.raw,
  });

  return savedFile;
}
