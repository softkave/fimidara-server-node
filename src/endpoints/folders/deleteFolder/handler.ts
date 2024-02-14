import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kPermissionAgentTypes} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkFolderAuthorization02} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {beginDeleteFolder} from './utils';
import {deleteFolderJoiSchema} from './validation';

const deleteFolder: DeleteFolderEndpoint = async instData => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const {folder} = await checkFolderAuthorization02(
    agent,
    data,
    kPermissionsMap.deleteFolder
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
