import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kPermissionAgentTypes} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getAndCheckFileAuthorization} from '../utils';
import {DeleteFileEndpoint} from './types';
import {beginDeleteFile} from './utils';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async instData => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);

  const file = await kSemanticModels.utils().withTxn(async opts => {
    return await getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kPermissionsMap.deleteFile,
      incrementPresignedPathUsageCount: true,
      shouldIngestFile: false,
    });
  });

  const [job] = await beginDeleteFile({
    agent,
    workspaceId: file.workspaceId,
    resources: [file],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteFile;
