import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {decrementStorageUsageRecord} from '../../usage/usageFns.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {DeleteFileEndpoint} from './types.js';
import {beginDeleteFile} from './utils.js';
import {deleteFileJoiSchema} from './validation.js';

const deleteFile: DeleteFileEndpoint = async reqData => {
  const data = validate(reqData.data, deleteFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );

  const file = await kSemanticModels.utils().withTxn(async opts => {
    return await getAndCheckFileAuthorization({
      action: kFimidaraPermissionActions.deleteFile,
      incrementPresignedPathUsageCount: true,
      shouldIngestFile: false,
      matcher: data,
      agent,
      opts,
    });
  });

  kUtilsInjectables
    .promises()
    .forget(decrementStorageUsageRecord(reqData, file));

  const [job] = await beginDeleteFile({
    workspaceId: file.workspaceId,
    resources: [file],
    agent,
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteFile;
