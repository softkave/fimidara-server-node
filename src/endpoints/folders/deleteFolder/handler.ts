import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkFolderAuthorization02} from '../utils.js';
import {DeleteFolderEndpoint} from './types.js';
import {beginDeleteFolder} from './utils.js';
import {deleteFolderJoiSchema} from './validation.js';

const deleteFolder: DeleteFolderEndpoint = async instData => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {folder} = await checkFolderAuthorization02(
    agent,
    data,
    kFimidaraPermissionActionsMap.deleteFolder
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
