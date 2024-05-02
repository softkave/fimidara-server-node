import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {DeleteFileEndpoint} from './types.js';
import {beginDeleteFile} from './utils.js';
import {deleteFileJoiSchema} from './validation.js';

const deleteFile: DeleteFileEndpoint = async instData => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kSemanticModels.utils().withTxn(async opts => {
    return await getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActionsMap.deleteFile,
      incrementPresignedPathUsageCount: true,
      shouldIngestFile: false,
    });
  }, /** reuseTxn */ false);

  const [job] = await beginDeleteFile({
    agent,
    workspaceId: file.workspaceId,
    resources: [file],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteFile;
