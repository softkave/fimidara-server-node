import {omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {BasicCRUDActions, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {replacePublicPermissionGroupAccessOps} from '../../permissionItems/utils';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let {workspace, folder} = await checkFolderAuthorization02(
    context,
    agent,
    data,
    BasicCRUDActions.Update
  );
  const incomingPublicAccessOps = data.folder.publicAccessOps;
  const update: Partial<IFolder> = {
    ...omit(data.folder, 'publicAccessOps'),
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  folder = await context.semantic.folder.getAndUpdateOneById(folder.resourceId, update);

  const hasPublicAccessOpsChanges = !!incomingPublicAccessOps ?? data.folder.removePublicAccessOps;
  if (hasPublicAccessOpsChanges) {
    let publicAccessOps = incomingPublicAccessOps
      ? incomingPublicAccessOps.map(op => ({
          ...op,
          markedAt: getTimestamp(),
          markedBy: agent,
        }))
      : [];

    if (data.folder.removePublicAccessOps) {
      publicAccessOps = [];
    }

    await replacePublicPermissionGroupAccessOps(context, agent, workspace, publicAccessOps, folder);
  }

  await saveResourceAssignedItems(context, agent, workspace, folder.resourceId, data.folder, true);
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {folder: folderExtractor(folder!)};
};

export default updateFolder;
