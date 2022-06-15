import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkFolderAuthorization02,
  folderExtractor,
  getFolderMatcher,
} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  let {folder} = await checkFolderAuthorization02(
    context,
    agent,
    getFolderMatcher(agent, data),
    BasicCRUDActions.Read
  );

  folder = await withAssignedPermissionGroupsAndTags(
    context,
    folder.workspaceId,
    folder,
    AppResourceType.Folder
  );

  return {
    folder: folderExtractor(folder),
  };
};

export default getFolder;
