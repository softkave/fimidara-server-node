import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {decrementStorageUsageRecord} from '../../usage/usageFns.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {DeleteFileEndpoint} from './types.js';
import {beginDeleteFile} from './utils.js';
import {deleteFileJoiSchema} from './validation.js';

const deleteFile: DeleteFileEndpoint = async reqData => {
  const data = validate(reqData.data, deleteFileJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const file = await kSemanticModels.utils().withTxn(async opts => {
    return await getAndCheckFileAuthorization({
      agent,
      opts,
      workspaceId,
      action: kFimidaraPermissionActions.deleteFile,
      incrementPresignedPathUsageCount: true,
      shouldIngestFile: false,
      matcher: data,
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
