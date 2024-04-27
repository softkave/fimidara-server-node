import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkFolderAuthorization02} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {beginDeleteFolder} from './utils';
import {deleteFolderJoiSchema} from './validation';

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
