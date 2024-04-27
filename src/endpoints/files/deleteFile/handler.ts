import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getAndCheckFileAuthorization} from '../utils';
import {DeleteFileEndpoint} from './types';
import {beginDeleteFile} from './utils';
import {deleteFileJoiSchema} from './validation';

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
