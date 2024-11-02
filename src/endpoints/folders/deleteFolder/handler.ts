import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {checkFolderAuthorization02} from '../utils.js';
import {DeleteFolderEndpoint} from './types.js';
import {beginDeleteFolder} from './utils.js';
import {deleteFolderJoiSchema} from './validation.js';

const deleteFolder: DeleteFolderEndpoint = async reqData => {
  const data = validate(reqData.data, deleteFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const {folder} = await checkFolderAuthorization02(
    agent,
    data,
    kFimidaraPermissionActions.deleteFolder
  );

  const [job] = await beginDeleteFolder({
    agent,
    workspaceId: folder.workspaceId,
    resources: [folder],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteFolder;
