import {isNull, omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {AppResourceType, BasicCRUDActions, publicPermissibleEndpointAgents} from '../../../definitions/system';
import {getDate, getDateString} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {replacePublicPermissionGroupAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import FolderQueries from '../queries';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, publicPermissibleEndpointAgents);
  const checkResult = await checkFolderAuthorization02(context, agent, data, BasicCRUDActions.Update);
  let folder = checkResult.folder;
  const workspace = checkResult.workspace;
  const incomingPublicAccessOps = data.folder.publicAccessOps;
  const update: Partial<IFolder> = {
    ...omit(data.folder, 'publicAccessOps'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  folder = await context.data.folder.assertUpdateItem(FolderQueries.getById(folder.resourceId), update);
  const hasPublicAccessOpsChanges =
    incomingPublicAccessOps || isNull(incomingPublicAccessOps) || data.folder.removePublicAccessOps;

  if (hasPublicAccessOpsChanges) {
    let publicAccessOps = incomingPublicAccessOps
      ? incomingPublicAccessOps.map(op => ({
          ...op,
          markedAt: getDate(),
          markedBy: agent,
        }))
      : [];

    if (data.folder.removePublicAccessOps) {
      publicAccessOps = [];
    }

    await replacePublicPermissionGroupAccessOpsByPermissionOwner(
      context,
      agent,
      workspace,
      folder.resourceId,
      AppResourceType.Folder,
      publicAccessOps
    );
  }

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    folder.resourceId,
    AppResourceType.Folder,
    data.folder,
    true
  );

  folder = await populateAssignedPermissionGroupsAndTags(context, folder.workspaceId, folder, AppResourceType.Folder);

  return {folder: folderExtractor(folder)};
};

export default updateFolder;
